import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
export declare const GEMINI_CLIENT = "GEMINI_CLIENT";
export type GeminiClient = Pick<GoogleGenAI, 'models'>;
export declare const geminiClientProvider: {
    provide: string;
    inject: (typeof ConfigService)[];
    useFactory: (config: ConfigService) => GeminiClient | null;
};
