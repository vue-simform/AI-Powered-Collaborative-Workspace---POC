import { ConfigService } from '@nestjs/config';
import { type GeminiClient } from '../ai/gemini.client.js';
export declare class EmbeddingService {
    private readonly gemini;
    private readonly config;
    private readonly logger;
    retryDelays: number[];
    perMinute: number;
    sleep: (ms: number) => Promise<void>;
    private sent;
    constructor(gemini: GeminiClient | null, config: ConfigService);
    embed(texts: string[], kind: 'document' | 'query'): Promise<number[][]>;
    private waitForQuota;
    private embedBatch;
}
