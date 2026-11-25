var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DocumentService_1;
import { BadRequestException, ConflictException, HttpException, Injectable, Logger, NotFoundException, } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';
import { PrismaService } from '../../prisma.service.js';
import { ProjectService } from '../project/project.service.js';
import { checkFileType } from './document-files.js';
import { DocumentStorage } from './document-storage.js';
import { DocumentError, readDocx, readPdf, splitIntoChunks } from './document-text.js';
import { KnowledgeService } from './knowledge.service.js';
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
};
let DocumentService = DocumentService_1 = class DocumentService {
    prisma;
    projects;
    knowledge;
    logger = new Logger(DocumentService_1.name);
    storage;
    constructor(prisma, projects, knowledge, config) {
        this.prisma = prisma;
        this.projects = projects;
        this.knowledge = knowledge;
        this.storage = new DocumentStorage(path.resolve(process.cwd(), config.get('DOCUMENTS_DIR') || 'storage/documents'));
    }
    async onApplicationBootstrap() {
        try {
            await this.prisma.projectDocument.updateMany({
                where: { status: { in: ['UPLOADED', 'PROCESSING'] } },
                data: { status: 'FAILED', errorMessage: 'Processing was interrupted. Please retry.' },
            });
        }
        catch (e) {
            this.logger.warn(`Could not reset interrupted documents: ${e.message}`);
        }
    }
    async list(projectId) {
        await this.projects.findOne(projectId);
        return this.prisma.projectDocument.findMany({ where: { projectId }, select: publicFields, orderBy: { createdAt: 'desc' } });
    }
    async upload(projectId, files, userId) {
        await this.projects.findOne(projectId);
        if (!files?.length)
            throw new BadRequestException('Choose at least one PDF or DOCX file');
        const checked = files.map((file) => ({
            file,
            type: checkFileType(file),
            hash: createHash('sha256').update(file.buffer).digest('hex'),
        }));
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
        const ids = [];
        for (const { file, type, hash } of checked) {
            const id = randomUUID();
            const storagePath = path.join(projectId, `${id}.${type}`);
            await this.storage.save(storagePath, file.buffer);
            try {
                await this.prisma.projectDocument.create({
                    data: { id, projectId, fileName: file.originalname, fileType: type, fileSize: file.size, storagePath, contentHash: hash, uploadedById: userId },
                });
            }
            catch (e) {
                await this.storage.remove(storagePath);
                throw e;
            }
            ids.push(id);
        }
        for (const id of ids)
            void this.process(id);
        return this.prisma.projectDocument.findMany({ where: { id: { in: ids } }, select: publicFields, orderBy: { createdAt: 'desc' } });
    }
    async remove(projectId, documentId) {
        const doc = await this.findInProject(projectId, documentId);
        await this.prisma.projectDocument.delete({ where: { id: doc.id } });
        await this.storage.remove(doc.storagePath);
    }
    async retry(projectId, documentId) {
        const doc = await this.findInProject(projectId, documentId);
        if (doc.status !== 'FAILED')
            throw new BadRequestException('Only failed documents can be retried');
        await this.setStatus(doc.id, 'UPLOADED');
        void this.process(doc.id);
        return this.prisma.projectDocument.findUniqueOrThrow({ where: { id: doc.id }, select: publicFields });
    }
    async process(documentId) {
        const doc = await this.prisma.projectDocument.findUnique({ where: { id: documentId } });
        if (!doc || doc.status === 'PROCESSING')
            return;
        const chunkCount = await this.prisma.documentChunk.count({ where: { documentId } });
        if (doc.status === 'PROCESSED' && chunkCount > 0)
            return;
        await this.setStatus(documentId, 'PROCESSING');
        try {
            const file = await this.storage.read(doc.storagePath);
            const parts = doc.fileType === 'pdf' ? await readPdf(file) : await readDocx(file);
            const chunks = splitIntoChunks(parts);
            this.logger.log(`"${doc.fileName}": ${chunks.length} chunks created`);
            if (chunks.length === 0)
                throw new DocumentError('No readable text was found (the document may be scanned or empty).');
            await this.knowledge.saveChunks(doc, chunks);
            await this.setStatus(documentId, 'PROCESSED');
            this.logger.log(`"${doc.fileName}": all ${chunks.length} chunks stored, document is PROCESSED`);
        }
        catch (e) {
            this.logger.error(`Processing document ${documentId} failed: ${e.message}`);
            const message = e instanceof DocumentError || e instanceof HttpException ? e.message : 'The document could not be processed.';
            await this.setStatus(documentId, 'FAILED', message);
        }
    }
    async findInProject(projectId, documentId) {
        const doc = await this.prisma.projectDocument.findFirst({ where: { id: documentId, projectId } });
        if (!doc)
            throw new NotFoundException('Document not found');
        return doc;
    }
    setStatus(id, status, errorMessage = null) {
        return this.prisma.projectDocument.update({ where: { id }, data: { status, errorMessage } });
    }
};
DocumentService = DocumentService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        ProjectService,
        KnowledgeService,
        ConfigService])
], DocumentService);
export { DocumentService };
//# sourceMappingURL=document.service.js.map