import { ServiceUnavailableException } from '@nestjs/common';
import { ApiError } from '@google/genai';
import { EmbeddingService } from './embedding.service.js';

const vec = () => Array.from({ length: 768 }, () => 0.1);

function setup(opts: { embedContent?: any; noClient?: boolean } = {}) {
  const client = opts.noClient ? null : { models: { embedContent: opts.embedContent ?? vi.fn() } };
  const config = { get: vi.fn() };
  const service = new EmbeddingService(client as any, config as any);
  service.retryDelays = [0, 0, 0];
  service.perMinute = Infinity; // pacing is tested separately
  service.sleep = vi.fn(async () => {}); // no real waiting in tests
  return { service };
}

describe('EmbeddingService: text to numbers', () => {
  it('returns one 768-number vector per text, using the right task type and size', async () => {
    const embedContent = vi.fn(async ({ contents }: any) => ({ embeddings: contents.map(() => ({ values: vec() })) }));
    const out = await setup({ embedContent }).service.embed(['a', 'b'], 'query');
    expect(out).toHaveLength(2);
    expect(embedContent.mock.calls[0][0].config).toEqual({ taskType: 'RETRIEVAL_QUERY', outputDimensionality: 768 });
  });

  it('sends large inputs in small batches', async () => {
    const embedContent = vi.fn(async ({ contents }: any) => ({ embeddings: contents.map(() => ({ values: vec() })) }));
    const out = await setup({ embedContent }).service.embed(Array.from({ length: 120 }, (_, i) => `t${i}`), 'document');
    expect(out).toHaveLength(120);
    expect(embedContent).toHaveBeenCalledTimes(4); // 120 texts in batches of 30
  });

  it('retries an overloaded model (503) and then succeeds', async () => {
    const embedContent = vi.fn().mockRejectedValueOnce(new ApiError({ message: 'busy', status: 503 })).mockResolvedValue({ embeddings: [{ values: vec() }] });
    await expect(setup({ embedContent }).service.embed(['a'], 'document')).resolves.toHaveLength(1);
    expect(embedContent).toHaveBeenCalledTimes(2);
  });

  it('gives up after the retries with a friendly error', async () => {
    const embedContent = vi.fn().mockRejectedValue(new ApiError({ message: 'busy', status: 503 }));
    await expect(setup({ embedContent }).service.embed(['a'], 'document')).rejects.toThrow('AI is busy right now');
    expect(embedContent).toHaveBeenCalledTimes(4);
  });

  it('does not retry a bad key or leak details, and rejects a wrong-sized vector', async () => {
    const forbidden = vi.fn().mockRejectedValue(new ApiError({ message: 'SECRET', status: 403 }));
    await expect(setup({ embedContent: forbidden }).service.embed(['a'], 'document')).rejects.toThrow('AI service is unavailable');
    expect(forbidden).toHaveBeenCalledTimes(1);
    const wrong = vi.fn().mockResolvedValue({ embeddings: [{ values: [1, 2, 3] }] });
    await expect(setup({ embedContent: wrong }).service.embed(['a'], 'document')).rejects.toThrow('AI service is unavailable');
  });

  it('waits for the per-minute window instead of sending too fast', async () => {
    const embedContent = vi.fn(async ({ contents }: any) => ({ embeddings: contents.map(() => ({ values: vec() })) }));
    const { service } = setup({ embedContent });
    service.perMinute = 60; // two batches of 30 fit in a minute, the third must wait
    let now = 1_000_000; // a fake clock that only moves when the service "sleeps"
    const clock = vi.spyOn(Date, 'now').mockImplementation(() => now);
    service.sleep = vi.fn(async (ms: number) => { now += ms; });
    await service.embed(Array.from({ length: 90 }, (_, i) => `t${i}`), 'document');
    clock.mockRestore();
    expect(embedContent).toHaveBeenCalledTimes(3);
    expect(service.sleep).toHaveBeenCalledTimes(1);
  });

  it('on 429 waits as long as Google asks, then retries', async () => {
    const limited = new ApiError({ message: 'quota. Please retry in 36.5s', status: 429 });
    const embedContent = vi.fn().mockRejectedValueOnce(limited).mockResolvedValue({ embeddings: [{ values: vec() }] });
    const { service } = setup({ embedContent });
    await expect(service.embed(['a'], 'document')).resolves.toHaveLength(1);
    expect(service.sleep).toHaveBeenCalledWith(37500); // 36.5s + 1s safety
  });

  it('on 429 with a very long wait reports the daily limit', async () => {
    const embedContent = vi.fn().mockRejectedValue(new ApiError({ message: 'quota. Please retry in 40000s', status: 429 }));
    await expect(setup({ embedContent }).service.embed(['a'], 'document')).rejects.toThrow('daily AI limit');
  });

  it('answers 503 when no API key is configured', async () => {
    await expect(setup({ noClient: true }).service.embed(['a'], 'document')).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
