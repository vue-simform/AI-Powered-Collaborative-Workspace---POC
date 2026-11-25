import { Module } from '@nestjs/common';
import { GEMINI_CLIENT, geminiClientProvider } from './gemini.client.js';

// One Gemini client shared by task generation and document embeddings.
@Module({ providers: [geminiClientProvider], exports: [GEMINI_CLIENT] })
export class GeminiModule {}
