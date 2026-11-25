import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { DocumentError, readDocx, readPdf } from './document-text.js';
import { DocumentService } from './document.service.js';

vi.mock('node:fs/promises', () => ({ mkdir: vi.fn(), writeFile: vi.fn(), readFile: vi.fn(), rm: vi.fn() }));
vi.mock('./document-text.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./document-text.js')>()),
  readPdf: vi.fn(),
  readDocx: vi.fn(),
}));

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const pdf = (name: string, tail = 'x') => ({ originalname: name, mimetype: 'application/pdf', size: 10, buffer: Buffer.from(`%PDF-${tail}`) });
const docx = (name: string) => ({ originalname: name, mimetype: DOCX_MIME, size: 10, buffer: Buffer.from([0x50, 0x4b, 0x03, 0x04, 0, 0]) });
const doc = (extra = {}) => ({ id: 'd1', projectId: 'p1', fileType: 'pdf', storagePath: 'p1/d1.pdf', status: 'UPLOADED', ...extra });

function setup(opts: { project?: boolean; existing?: { fileName: string }[]; doc?: any; chunkCount?: number; realProcess?: boolean } = {}) {
  const prisma = {
    projectDocument: {
      findMany: vi.fn(async (args: any) => (args.where?.contentHash ? (opts.existing ?? []) : [])),
      create: vi.fn(async ({ data }: any) => ({ id: data.id })),
      findFirst: vi.fn().mockResolvedValue(opts.doc ?? null),
      findUnique: vi.fn().mockResolvedValue(opts.doc ?? null),
      findUniqueOrThrow: vi.fn().mockResolvedValue({ id: 'd1' }),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    documentChunk: { count: vi.fn().mockResolvedValue(opts.chunkCount ?? 0) },
  };
  const projects = {
    findOne: vi.fn(async () => {
      if (opts.project === false) throw new NotFoundException('Project not found');
      return { id: 'p1' };
    }),
  };
  const knowledge = { saveChunks: vi.fn() };
  const config = { get: vi.fn(() => undefined) };
  const service = new DocumentService(prisma as any, projects as any, knowledge as any, config as any);
  // Uploads start processing in the background; most tests only care that it was started.
  const process = opts.realProcess ? undefined : vi.spyOn(service, 'process').mockResolvedValue();
  return { prisma, knowledge, service, process };
}

const statuses = (prisma: any) => prisma.projectDocument.update.mock.calls.map((c: any) => c[0].data.status);

describe('DocumentService: upload', () => {
  beforeEach(() => vi.clearAllMocks());

  it('saves each valid file, links it to the project and uploader, and starts processing', async () => {
    const { service, prisma, process } = setup();
    await service.upload('p1', [pdf('a.pdf', '1'), docx('b.docx')], 'u1');
    expect(prisma.projectDocument.create).toHaveBeenCalledTimes(2);
    expect(prisma.projectDocument.create.mock.calls[0][0].data).toMatchObject({ projectId: 'p1', fileName: 'a.pdf', fileType: 'pdf', uploadedById: 'u1' });
    expect(prisma.projectDocument.create.mock.calls[1][0].data).toMatchObject({ fileName: 'b.docx', fileType: 'docx' });
    expect(writeFile).toHaveBeenCalledTimes(2);
    expect(process).toHaveBeenCalledTimes(2);
  });

  it('never selects the storage path or hash for the client', async () => {
    const { service, prisma } = setup();
    await service.upload('p1', [pdf('a.pdf')], 'u1');
    const select = prisma.projectDocument.findMany.mock.calls.at(-1)![0].select;
    expect(select).not.toHaveProperty('storagePath');
    expect(select).not.toHaveProperty('contentHash');
  });

  it('rejects unsupported, renamed and corrupted files, and saves nothing', async () => {
    const bad = [
      { originalname: 'notes.txt', mimetype: 'text/plain', size: 2, buffer: Buffer.from('hi') },
      { originalname: 'noextension', mimetype: 'application/pdf', size: 4, buffer: Buffer.from('%PDF') },
      { originalname: 'fake.pdf', mimetype: 'application/pdf', size: 4, buffer: Buffer.from([0x4d, 0x5a, 0x90, 0x00]) },
      { originalname: 'a.docx', mimetype: 'application/pdf', size: 4, buffer: Buffer.from([0x50, 0x4b, 0x03, 0x04]) },
    ];
    for (const file of bad) {
      const { service, prisma } = setup();
      await expect(service.upload('p1', [pdf('ok.pdf'), file], 'u1')).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.projectDocument.create).not.toHaveBeenCalled();
    }
    expect(writeFile).not.toHaveBeenCalled();
  });

  it('rejects an empty upload, an unknown project and a duplicate file', async () => {
    await expect(setup().service.upload('p1', [], 'u1')).rejects.toBeInstanceOf(BadRequestException);
    await expect(setup({ project: false }).service.upload('nope', [pdf('a.pdf')], 'u1')).rejects.toBeInstanceOf(NotFoundException);
    await expect(setup({ existing: [{ fileName: 'old.pdf' }] }).service.upload('p1', [pdf('a.pdf')], 'u1')).rejects.toBeInstanceOf(ConflictException);
    await expect(setup().service.upload('p1', [pdf('a.pdf'), pdf('copy.pdf')], 'u1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('removes the file again if the database insert fails', async () => {
    const { service, prisma } = setup();
    prisma.projectDocument.create.mockRejectedValueOnce(new Error('db'));
    await expect(service.upload('p1', [pdf('a.pdf')], 'u1')).rejects.toThrow('db');
    expect(rm).toHaveBeenCalledTimes(1);
  });
});

describe('DocumentService: remove and retry', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deletes the row (chunks go with it) and the file, only inside the given project', async () => {
    const { service, prisma } = setup({ doc: doc({ status: 'PROCESSED' }) });
    await service.remove('p1', 'd1');
    expect(prisma.projectDocument.findFirst).toHaveBeenCalledWith({ where: { id: 'd1', projectId: 'p1' } });
    expect(prisma.projectDocument.delete).toHaveBeenCalledWith({ where: { id: 'd1' } });
    expect(rm).toHaveBeenCalledTimes(1);
    await expect(setup().service.remove('p1', 'other-projects-doc')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('retries only failed documents', async () => {
    const failed = setup({ doc: doc({ status: 'FAILED' }) });
    await failed.service.retry('p1', 'd1');
    expect(failed.process).toHaveBeenCalledWith('d1');
    await expect(setup({ doc: doc({ status: 'PROCESSED' }) }).service.retry('p1', 'd1')).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('DocumentService: processing', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reads, chunks and stores a PDF, then marks it PROCESSED', async () => {
    vi.mocked(readFile).mockResolvedValue(Buffer.from('file'));
    vi.mocked(readPdf).mockResolvedValue([{ text: 'Email is mandatory.', pageNumber: 4 }]);
    const { service, prisma, knowledge } = setup({ doc: doc(), realProcess: true });
    await service.process('d1');
    expect(knowledge.saveChunks).toHaveBeenCalledWith(expect.objectContaining({ id: 'd1', projectId: 'p1' }), [
      { content: 'Email is mandatory.', pageNumber: 4, section: null },
    ]);
    expect(statuses(prisma)).toEqual(['PROCESSING', 'PROCESSED']);
  });

  it('uses the DOCX reader for docx files', async () => {
    vi.mocked(readFile).mockResolvedValue(Buffer.from('file'));
    vi.mocked(readDocx).mockResolvedValue([{ text: 'Rule', section: 'Login' }]);
    const { service } = setup({ doc: doc({ fileType: 'docx', storagePath: 'p1/d1.docx' }), realProcess: true });
    await service.process('d1');
    expect(readDocx).toHaveBeenCalled();
    expect(readPdf).not.toHaveBeenCalled();
  });

  it('marks a document with no readable text FAILED with a clear message', async () => {
    vi.mocked(readFile).mockResolvedValue(Buffer.from('file'));
    vi.mocked(readPdf).mockResolvedValue([{ text: '  ', pageNumber: 1 }]);
    const { service, prisma, knowledge } = setup({ doc: doc(), realProcess: true });
    await service.process('d1');
    expect(prisma.projectDocument.update).toHaveBeenLastCalledWith({ where: { id: 'd1' }, data: { status: 'FAILED', errorMessage: expect.stringContaining('No readable text') } });
    expect(knowledge.saveChunks).not.toHaveBeenCalled();
  });

  it('marks a corrupt file and a provider failure FAILED, without throwing and without leaking details', async () => {
    vi.mocked(readFile).mockResolvedValue(Buffer.from('file'));
    vi.mocked(readPdf).mockRejectedValueOnce(new DocumentError('The PDF could not be read'));
    const corrupt = setup({ doc: doc(), realProcess: true });
    await expect(corrupt.service.process('d1')).resolves.toBeUndefined();
    expect(corrupt.prisma.projectDocument.update).toHaveBeenLastCalledWith({ where: { id: 'd1' }, data: { status: 'FAILED', errorMessage: 'The PDF could not be read' } });

    vi.mocked(readPdf).mockResolvedValue([{ text: 'x', pageNumber: 1 }]);
    const provider = setup({ doc: doc(), realProcess: true });
    provider.knowledge.saveChunks.mockRejectedValueOnce(new Error('secret provider detail'));
    await provider.service.process('d1');
    expect(provider.prisma.projectDocument.update).toHaveBeenLastCalledWith({ where: { id: 'd1' }, data: { status: 'FAILED', errorMessage: 'The document could not be processed.' } });
  });

  it('skips a document that is already processed and has chunks (no new embeddings)', async () => {
    const { service, prisma, knowledge } = setup({ doc: doc({ status: 'PROCESSED' }), chunkCount: 5, realProcess: true });
    await service.process('d1');
    expect(knowledge.saveChunks).not.toHaveBeenCalled();
    expect(prisma.projectDocument.update).not.toHaveBeenCalled();
  });

  it('marks documents interrupted by a restart as FAILED on boot, and still starts without the table', async () => {
    const { service, prisma } = setup();
    await service.onApplicationBootstrap();
    expect(prisma.projectDocument.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'FAILED' }) }));
    prisma.projectDocument.updateMany.mockRejectedValueOnce(new Error('relation "ProjectDocument" does not exist'));
    await expect(service.onApplicationBootstrap()).resolves.toBeUndefined();
  });
});
