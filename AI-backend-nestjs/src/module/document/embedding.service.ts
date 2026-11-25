import { BadGatewayException, HttpException, Inject, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiError } from '@google/genai';
import { GEMINI_CLIENT, type GeminiClient } from '../ai/gemini.client.js';

// An embedding model turns text into a list of numbers (a vector) that captures its meaning.
// Texts with similar meaning get similar numbers, which is how we search by meaning, not just keywords.
const DEFAULT_EMBEDDING_MODEL = 'gemini-embedding-001';
const NUMBERS_PER_TEXT = 768; // must match vector(768) in document.prisma
const BATCH_SIZE = 30; // how many texts we send to Gemini in one request
// The free tier allows 100 embedding requests per minute and each text counts as one request.
// We stay a little under it (90) so we are never refused.
const REQUESTS_PER_MINUTE = 90;
const MAX_RATE_LIMIT_RETRIES = 5; // how many times we wait and retry after Google says "too many requests"
const MAX_WAIT_MS = 2 * 60 * 1000; // if Google asks us to wait longer than this, the DAILY limit is used up

// Google tells us how long to wait inside the error text (for example "Please retry in 36.5s").
// Returns milliseconds, or 60 seconds if Google gave no hint.
function retryDelayMs(error: ApiError) {
  const hint = /retry in ([\d.]+)s/i.exec(error.message) ?? /"retryDelay":\s*"([\d.]+)s"/.exec(error.message);
  return hint ? Math.ceil(Number(hint[1]) * 1000) + 1000 : 60_000;
}

// Turns text into numbers with Gemini, and keeps within the free-tier limits while doing it.
@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  retryDelays = [1000, 2000, 4000]; // how long to wait before each retry when Google is busy (503)
  perMinute = REQUESTS_PER_MINUTE; // public so tests can change it
  // Pauses for `ms` milliseconds. A separate field so tests can replace it with an instant one.
  sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
  // Remembers when we sent texts to Gemini, so we never send more than `perMinute` in any 60 seconds.
  private sent: { at: number; count: number }[] = [];

  // Injected: Gemini client (null if no key) and config (.env).
  constructor(
    @Inject(GEMINI_CLIENT) private readonly gemini: GeminiClient | null,
    private readonly config: ConfigService,
  ) {}

  // Returns 768 numbers for each text, in the same order. Similar meaning gives similar numbers.
  // `kind` tells Gemini if the text is a document chunk or a search question, which improves the match.
  async embed(texts: string[], kind: 'document' | 'query'): Promise<number[][]> {
    // Without an API key we cannot create embeddings.
    if (!this.gemini) throw new ServiceUnavailableException('AI is not configured');
    const vectors: number[][] = [];
    // Only documents are big enough to be worth logging (a search question is a single text).
    if (kind === 'document') {
      const minutes = Math.max(1, Math.ceil(texts.length / this.perMinute));
      this.logger.log(`Embedding ${texts.length} chunks (about ${minutes} minute${minutes > 1 ? 's' : ''} on the free tier)`);
    }
    // Send texts in batches so one request is not too large.
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      vectors.push(...(await this.embedBatch(texts.slice(i, i + BATCH_SIZE), kind)));
      if (kind === 'document') this.logger.log(`Embedded ${vectors.length}/${texts.length} chunks`);
    }
    return vectors;
  }

  // Waits until sending `count` more texts keeps us under the per-minute limit, then records them as sent.
  // Think of a bucket that holds `perMinute` requests and refills as old requests become one minute old.
  private async waitForQuota(count: number) {
    for (;;) {
      const now = Date.now();
      this.sent = this.sent.filter((s) => now - s.at < 60_000); // forget anything older than a minute
      const used = this.sent.reduce((sum, s) => sum + s.count, 0);
      if (used + count <= this.perMinute) {
        this.sent.push({ at: now, count });
        return;
      }
      // Wait until the oldest request is a minute old, then check again.
      const wait = Math.max(this.sent[0].at + 60_000 - now, 0) + 500;
      this.logger.log(`Free-tier limit reached (${used}/${this.perMinute} per minute). Waiting ${Math.ceil(wait / 1000)}s before the next batch...`);
      await this.sleep(wait);
    }
  }

  // Embeds one batch with Gemini, staying under the free-tier limit. If Google says "too many requests" (429)
  // or "busy" (503), we wait and send the same batch again; any other problem stops with a friendly error.
  private async embedBatch(batch: string[], kind: 'document' | 'query') {
    for (let attempt = 0; ; attempt++) {
      await this.waitForQuota(batch.length); // never send faster than the free tier allows
      try {
        const response = await this.gemini!.models.embedContent({
          model: this.config.get<string>('GEMINI_EMBEDDING_MODEL') || DEFAULT_EMBEDDING_MODEL,
          contents: batch,
          config: { taskType: kind === 'document' ? 'RETRIEVAL_DOCUMENT' : 'RETRIEVAL_QUERY', outputDimensionality: NUMBERS_PER_TEXT },
        });
        // We must get one vector per text, each exactly 768 numbers long (what the database column expects).
        const vectors = (response.embeddings ?? []).map((e) => e.values ?? []);
        if (vectors.length !== batch.length || vectors.some((v) => v.length !== NUMBERS_PER_TEXT)) {
          throw new Error('Unexpected embedding response');
        }
        return vectors;
      } catch (e) {
        const status = e instanceof ApiError ? e.status : 0;
        // How long to wait before trying again: as long as Google asks (429), or a short pause (503).
        const wait = status === 429 ? retryDelayMs(e as ApiError) : status === 503 ? this.retryDelays[attempt] : undefined;
        if (wait !== undefined && wait <= MAX_WAIT_MS && attempt < MAX_RATE_LIMIT_RETRIES) {
          this.logger.warn(`Gemini said ${status}. Waiting ${Math.ceil(wait / 1000)}s, then trying again (${attempt + 1}/${MAX_RATE_LIMIT_RETRIES})...`);
          await this.sleep(wait);
          continue;
        }

        // Giving up: log the real reason, but show the user a short, safe message.
        this.logger.error(`Gemini embedding failed: ${status} ${(e as Error).message}`);
        if (status === 429) {
          // A very long wait means the DAILY limit is used up.
          throw new HttpException(
            wait! > MAX_WAIT_MS ? 'The daily AI limit was reached. Please try again tomorrow.' : 'AI is rate limited right now. Please wait a minute and press Retry.',
            429,
          );
        }
        if (status === 503) throw new ServiceUnavailableException('AI is busy right now, please try again in a moment');
        throw new BadGatewayException('AI service is unavailable, please try again');
      }
    }
  }
}
