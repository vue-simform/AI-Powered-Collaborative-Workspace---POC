import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
export const GEMINI_CLIENT = 'GEMINI_CLIENT';
export const geminiClientProvider = {
    provide: GEMINI_CLIENT,
    inject: [ConfigService],
    useFactory: (config) => {
        const apiKey = config.get('GEMINI_API_KEY');
        return apiKey ? new GoogleGenAI({ apiKey, httpOptions: { timeout: 30_000 } }) : null;
    },
};
//# sourceMappingURL=gemini.client.js.map