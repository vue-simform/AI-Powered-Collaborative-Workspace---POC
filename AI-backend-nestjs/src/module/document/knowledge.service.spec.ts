import { KnowledgeService } from './knowledge.service.js';

const vec = () => Array.from({ length: 768 }, () => 0.1);

function setup(opts: { rows?: any[]; env?: Record<string, string> } = {}) {
  const prisma = {
    documentChunk: { deleteMany: vi.fn() },
    $queryRaw: vi.fn().mockResolvedValue(opts.rows ?? []),
    $executeRaw: vi.fn(),
    $transaction: vi.fn(),
  };
  const embeddings = { embed: vi.fn() }; // text-to-numbers is tested in embedding.service.spec.ts
  const config = { get: vi.fn((k: string) => opts.env?.[k]) };
  const service = new KnowledgeService(embeddings as any, config as any, prisma as any);
  return { service, prisma, embeddings };
}

describe('KnowledgeService: save chunks', () => {
  it("replaces the document's chunks in one transaction, embedding the text as documents", async () => {
    const { service, prisma, embeddings } = setup();
    const embed = vi.spyOn(embeddings, 'embed').mockResolvedValue([vec(), vec()]);
    await service.saveChunks({ id: 'd1', projectId: 'p1' }, [
      { content: 'one', pageNumber: 1, section: null },
      { content: 'two', pageNumber: 2, section: null },
    ]);
    expect(embed).toHaveBeenCalledWith(['one', 'two'], 'document');
    expect(prisma.documentChunk.deleteMany).toHaveBeenCalledWith({ where: { documentId: 'd1' } });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});

describe('KnowledgeService: search', () => {
  const row = (n: number, score: number) => ({ chunkId: `c${n}`, content: 'text', documentName: 'Req.pdf', pageNumber: n, section: null, score });
  const withVector = (s: ReturnType<typeof setup>) => vi.spyOn(s.embeddings, 'embed').mockResolvedValue([[0.1, 0.2, 0.3]]);

  it('scopes the vector query to the project (both the chunk and its document)', async () => {
    const s = setup({ rows: [row(1, 0.9)] });
    withVector(s);
    await s.service.search('project-A', 'user registration');
    const query = s.prisma.$queryRaw.mock.calls[0][0];
    expect(query.values.filter((v: unknown) => v === 'project-A')).toHaveLength(2);
    expect(query.sql).toContain('c."projectId" =');
    expect(query.sql).toContain('d."projectId" =');
    expect(query.sql).toContain(`d."status" = 'PROCESSED'`);
    expect(query.values).not.toContain('project-B');
  });

  it('embeds the question as a search query and applies top-K', async () => {
    const s = setup({ env: { RAG_TOP_K: '3' } });
    const embed = withVector(s);
    await s.service.search('p1', 'login');
    expect(embed).toHaveBeenCalledWith(['login'], 'query');
    expect(s.prisma.$queryRaw.mock.calls[0][0].values).toContain(3);
  });

  it('drops weak matches below the threshold', async () => {
    const s = setup({ rows: [row(1, 0.9), row(2, 0.49), row(3, 0.5)], env: { RAG_MIN_SCORE: '0.5' } });
    withVector(s);
    const result = await s.service.search('p1', 'login');
    expect(result.chunks.map((c) => c.chunkId)).toEqual(['c1', 'c3']);
  });
});
