import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

// A name (token) used to ask Nest for the Gemini client, since it is not a class we can inject by type.
export const GEMINI_CLIENT = 'GEMINI_CLIENT';

// We only need the 'models' part of the Google SDK; this also makes it easy to fake in tests.
export type GeminiClient = Pick<GoogleGenAI, 'models'>;

// null when no API key is configured, so the app still boots and the endpoint answers 503.
// Provider = a recipe that tells Nest how to build something to inject. Here: build the Gemini client once.
export const geminiClientProvider = {
  provide: GEMINI_CLIENT,
  inject: [ConfigService],
  // Factory = the function that builds the client. 30_000 ms = give up on a Google call after 30 seconds.
  useFactory: (config: ConfigService): GeminiClient | null => {
    const apiKey = config.get<string>('GEMINI_API_KEY');
    return apiKey ? new GoogleGenAI({ apiKey, httpOptions: { timeout: 30_000 } }) : null;
  },
};
