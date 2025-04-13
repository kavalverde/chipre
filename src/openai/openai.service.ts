import { Inject, Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { OPENAI_INSTANCE } from './providers/openai.provider';

@Injectable()
export class OpenaiService {
  constructor(
    @Inject(OPENAI_INSTANCE) private readonly openai: OpenAI
  ) {}

  getOpenAIInstance(): OpenAI {
    return this.openai;
  }
}
