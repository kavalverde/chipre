import { Provider } from '@nestjs/common';
import OpenAI from 'openai';

export const OPENAI_INSTANCE = 'OPENAI_INSTANCE';

export const OpenaiProvider: Provider = {
  provide: OPENAI_INSTANCE,
  useFactory: () => {
    return new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      project: process.env.OPENAI_PROJECT_ID,
    });
  },
};