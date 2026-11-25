var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var EmbeddingService_1;
import { BadGatewayException, HttpException, Inject, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiError } from '@google/genai';
import { GEMINI_CLIENT } from '../ai/gemini.client.js';
const DEFAULT_EMBEDDING_MODEL = 'gemini-embedding-001';
const NUMBERS_PER_TEXT = 768;
const BATCH_SIZE = 30;
const REQUESTS_PER_MINUTE = 90;
const MAX_RATE_LIMIT_RETRIES = 5;
const MAX_WAIT_MS = 2 * 60 * 1000;
function retryDelayMs(error) {
    const hint = /retry in ([\d.]+)s/i.exec(error.message) ?? /"retryDelay":\s*"([\d.]+)s"/.exec(error.message);
    return hint ? Math.ceil(Number(hint[1]) * 1000) + 1000 : 60_000;
}
let EmbeddingService = EmbeddingService_1 = class EmbeddingService {
    gemini;
    config;
    logger = new Logger(EmbeddingService_1.name);
    retryDelays = [1000, 2000, 4000];
    perMinute = REQUESTS_PER_MINUTE;
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    sent = [];
    constructor(gemini, config) {
        this.gemini = gemini;
        this.config = config;
    }
    async embed(texts, kind) {
        if (!this.gemini)
            throw new ServiceUnavailableException('AI is not configured');
        const vectors = [];
        if (kind === 'document') {
            const minutes = Math.max(1, Math.ceil(texts.length / this.perMinute));
            this.logger.log(`Embedding ${texts.length} chunks (about ${minutes} minute${minutes > 1 ? 's' : ''} on the free tier)`);
        }
        for (let i = 0; i < texts.length; i += BATCH_SIZE) {
            vectors.push(...(await this.embedBatch(texts.slice(i, i + BATCH_SIZE), kind)));
            if (kind === 'document')
                this.logger.log(`Embedded ${vectors.length}/${texts.length} chunks`);
        }
        return vectors;
    }
    async waitForQuota(count) {
        for (;;) {
            const now = Date.now();
            this.sent = this.sent.filter((s) => now - s.at < 60_000);
            const used = this.sent.reduce((sum, s) => sum + s.count, 0);
            if (used + count <= this.perMinute) {
                this.sent.push({ at: now, count });
                return;
            }
            const wait = Math.max(this.sent[0].at + 60_000 - now, 0) + 500;
            this.logger.log(`Free-tier limit reached (${used}/${this.perMinute} per minute). Waiting ${Math.ceil(wait / 1000)}s before the next batch...`);
            await this.sleep(wait);
        }
    }
    async embedBatch(batch, kind) {
        for (let attempt = 0;; attempt++) {
            await this.waitForQuota(batch.length);
            try {
                const response = await this.gemini.models.embedContent({
                    model: this.config.get('GEMINI_EMBEDDING_MODEL') || DEFAULT_EMBEDDING_MODEL,
                    contents: batch,
                    config: { taskType: kind === 'document' ? 'RETRIEVAL_DOCUMENT' : 'RETRIEVAL_QUERY', outputDimensionality: NUMBERS_PER_TEXT },
                });
                const vectors = (response.embeddings ?? []).map((e) => e.values ?? []);
                if (vectors.length !== batch.length || vectors.some((v) => v.length !== NUMBERS_PER_TEXT)) {
                    throw new Error('Unexpected embedding response');
                }
                return vectors;
            }
            catch (e) {
                const status = e instanceof ApiError ? e.status : 0;
                const wait = status === 429 ? retryDelayMs(e) : status === 503 ? this.retryDelays[attempt] : undefined;
                if (wait !== undefined && wait <= MAX_WAIT_MS && attempt < MAX_RATE_LIMIT_RETRIES) {
                    this.logger.warn(`Gemini said ${status}. Waiting ${Math.ceil(wait / 1000)}s, then trying again (${attempt + 1}/${MAX_RATE_LIMIT_RETRIES})...`);
                    await this.sleep(wait);
                    continue;
                }
                this.logger.error(`Gemini embedding failed: ${status} ${e.message}`);
                if (status === 429) {
                    throw new HttpException(wait > MAX_WAIT_MS ? 'The daily AI limit was reached. Please try again tomorrow.' : 'AI is rate limited right now. Please wait a minute and press Retry.', 429);
                }
                if (status === 503)
                    throw new ServiceUnavailableException('AI is busy right now, please try again in a moment');
                throw new BadGatewayException('AI service is unavailable, please try again');
            }
        }
    }
};
EmbeddingService = EmbeddingService_1 = __decorate([
    Injectable(),
    __param(0, Inject(GEMINI_CLIENT)),
    __metadata("design:paramtypes", [Object, ConfigService])
], EmbeddingService);
export { EmbeddingService };
//# sourceMappingURL=embedding.service.js.map