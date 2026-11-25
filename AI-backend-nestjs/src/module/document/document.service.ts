import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentStatus } from '@prisma/client';
import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';
import { PrismaService } from '../../prisma.service.js';
import { ProjectService } from '../project/project.service.js';
import { checkFileType, type UploadedFile } from './document-files.js';
import { DocumentStorage } from './document-storage.js';
import { DocumentError, readDocx, readPdf, splitIntoChunks } from './document-text.js';
import { KnowledgeService } from './knowledge.service.js';

// What the client may see. Never the storage path or the file hash.
const publicFields = {
  id: true,
  projectId: true,
  fileName: true,
  fileType: true,
  fileSize: true,
  status: true,
  errorMessage: true,
  createdAt: true,
  uploadedBy: { select: { id: true, name: true } },
} as const;

// Uploaded project documents: saving the file, tracking its status, and turning it into searchable chunks.
@Injectable()
export class DocumentService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DocumentService.name);
  private readonly storage: DocumentStorage; // the private folder on disk, outside src and not served by any route

  // Nest injects the database, project service, knowledge service and config. The folder is where files are saved.
  constructor(
    private readonly prisma: PrismaService,
    private readonly projects: ProjectService,
    private readonly knowledge: KnowledgeService,
    config: ConfigService,
  ) {
    this.storage = new DocumentStorage(path.resolve(process.cwd(), config.get<string>('DOCUMENTS_DIR') || 'storage/documents'));
  }

  // Processing runs inside this process, so a restart can interrupt it. Mark those documents so the user can retry.
  // Nest runs this once when the app starts (that is what OnApplicationBootstrap means).
  async onApplicationBootstrap() {
    try {
      await this.prisma.projectDocument.updateMany({
        where: { status: { in: ['UPLOADED', 'PROCESSING'] } },
        data: { status: 'FAILED', errorMessage: 'Processing was interrupted. Please retry.' },
      });
    } catch (e) {
      // e.g. the migration has not been applied yet; the app should still start.
      this.logger.warn(`Could not reset interrupted documents: ${(e as Error).message}`);
    }
  }

  // ---------- What the API offers ----------

  // Returns the project's documents, newest first, showing only the safe public fields.
  async list(projectId: string) {
    await this.projects.findOne(projectId);
    return this.prisma.projectDocument.findMany({ where: { projectId }, select: publicFields, orderBy: { createdAt: 'desc' } });
  }

  // Handles an upload: validates the files, saves them, then processes them in the background.
  async upload(projectId: string, files: UploadedFile[] | undefined, userId: string) {
    await this.projects.findOne(projectId);
    if (!files?.length) throw new BadRequestException('Choose at least one PDF or DOCX file');

    // 1. Check every file first, so one bad file means nothing is saved.
    const checked = files.map((file) => ({
      file,
      type: checkFileType(file),
      hash: createHash('sha256').update(file.buffer).digest('hex'), // a fingerprint of the content
    }));

    // 2. Refuse a file the project already has (same fingerprint).
    const hashes = checked.map((c) => c.hash);
    const existing = await this.prisma.projectDocument.findMany({
      where: { projectId, contentHash: { in: hashes } },
      select: { fileName: true },
    });
    const repeatedInBatch = checked.find((c, i) => hashes.indexOf(c.hash) !== i);
    if (existing.length || repeatedInBatch) {
      const names = existing.map((d) => d.fileName).concat(repeatedInBatch ? [repeatedInBatch.file.originalname] : []);
      throw new ConflictException(`Already uploaded to this project: ${names.join(', ')}`);
    }

    // 3. Save each file on disk and its details in the database.
    const ids: string[] = [];
    for (const { file, type, hash } of checked) {
      const id = randomUUID();
      const storagePath = path.join(projectId, `${id}.${type}`); // our own name, never the user's file name
      await this.storage.save(storagePath, file.buffer);
      try {
        await this.prisma.projectDocument.create({
          data: { id, projectId, fileName: file.originalname, fileType: type, fileSize: file.size, storagePath, contentHash: hash, uploadedById: userId },
        });
      } catch (e) {
        await this.storage.remove(storagePath); // do not leave a file without a database row
        throw e;
      }
      ids.push(id);
    }

    // 4. Reading and embedding can take a while, so the request returns now and the status shows the progress.
    for (const id of ids) void this.process(id);
    return this.prisma.projectDocument.findMany({ where: { id: { in: ids } }, select: publicFields, orderBy: { createdAt: 'desc' } });
  }

  // Deletes a document from the database and removes its file from disk.
  async remove(projectId: string, documentId: string) {
    const doc = await this.findInProject(projectId, documentId);
    await this.prisma.projectDocument.delete({ where: { id: doc.id } }); // its chunks are deleted with it
    await this.storage.remove(doc.storagePath);
  }

  // Re-runs processing for a document that failed earlier.
  async retry(projectId: string, documentId: string) {
    const doc = await this.findInProject(projectId, documentId);
    if (doc.status !== 'FAILED') throw new BadRequestException('Only failed documents can be retried');
    await this.setStatus(doc.id, 'UPLOADED');
    void this.process(doc.id);
    return this.prisma.projectDocument.findUniqueOrThrow({ where: { id: doc.id }, select: publicFields });
  }

  // ---------- Processing: file -> text -> chunks -> numbers ----------

  // Never throws. A problem ends as status FAILED with a message the user can read.
  async process(documentId: string) {
    const doc = await this.prisma.projectDocument.findUnique({ where: { id: documentId } });
    // Step 1: skip if the document is missing or already being processed (avoids doing the work twice).
    if (!doc || doc.status === 'PROCESSING') return;

    // Already done and nothing changed: do not pay for the same embeddings twice.
    const chunkCount = await this.prisma.documentChunk.count({ where: { documentId } });
    if (doc.status === 'PROCESSED' && chunkCount > 0) return;

    // Step 2: mark it as in progress so the UI can show a spinner.
    await this.setStatus(documentId, 'PROCESSING');
    try {
      // Step 3: read the file, extract its text, and cut the text into chunks (small pieces that are easy to search).
      const file = await this.storage.read(doc.storagePath);
      const parts = doc.fileType === 'pdf' ? await readPdf(file) : await readDocx(file);
      const chunks = splitIntoChunks(parts);
      this.logger.log(`"${doc.fileName}": ${chunks.length} chunks created`);
      if (chunks.length === 0) throw new DocumentError('No readable text was found (the document may be scanned or empty).');

      // Step 4: embed the chunks (turn text into numbers) and store them, then mark the document as done.
      await this.knowledge.saveChunks(doc, chunks);
      await this.setStatus(documentId, 'PROCESSED');
      this.logger.log(`"${doc.fileName}": all ${chunks.length} chunks stored, document is PROCESSED`);
    } catch (e) {
      this.logger.error(`Processing document ${documentId} failed: ${(e as Error).message}`);
      const message = e instanceof DocumentError || e instanceof HttpException ? e.message : 'The document could not be processed.';
      await this.setStatus(documentId, 'FAILED', message);
    }
  }

  // ---------- Small helpers ----------

  // Finds a document only if it belongs to the given project; otherwise 404. Stops cross-project access.
  private async findInProject(projectId: string, documentId: string) {
    const doc = await this.prisma.projectDocument.findFirst({ where: { id: documentId, projectId } });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  // Updates a document's status (and an error message if it failed).
  private setStatus(id: string, status: DocumentStatus, errorMessage: string | null = null) {
    return this.prisma.projectDocument.update({ where: { id }, data: { status, errorMessage } });
  }
}
