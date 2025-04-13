import { Inject, Injectable } from '@nestjs/common';
import { OPENAI_INSTANCE } from '../providers/openai.provider';
import OpenAI from 'openai';

@Injectable()
export class AssistantService {
    constructor(
        @Inject(OPENAI_INSTANCE) private readonly openai: OpenAI
      ) {}
}
