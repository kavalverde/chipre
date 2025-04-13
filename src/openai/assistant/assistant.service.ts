import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { OPENAI_INSTANCE } from '../providers/openai.provider';
import OpenAI from 'openai';
import {
  checkCompleteStatusUseCase,
  createMessageUseCase,
  createRunUseCase,
  createThreadUseCase,
  getMessageListUseCase,
} from './use-cases';
import { QuestionDto } from './dto';

@Injectable()
export class AssistantService {
  constructor(@Inject(OPENAI_INSTANCE) private readonly openai: OpenAI) {}

  async createThread() {
    const thread = await createThreadUseCase(this.openai);
    return {
      threadId: thread,
    };
  }

  async execute(questionDto: QuestionDto) {
    const { threadId, question, assistantId } = questionDto;

    const message = await createMessageUseCase(this.openai, {
      threadId,
      question,
    });
    if (!message) {
      throw new InternalServerErrorException('Error creating message');
    }
    const run = await createRunUseCase(this.openai, { assistantId, threadId });
    if (!run) {
      throw new InternalServerErrorException('Error creating run');
    }

    const check = await checkCompleteStatusUseCase(this.openai, {
      runId: run.id,
      threadId,
    });

    const messages = await getMessageListUseCase(this.openai, { threadId });

    let assistantResponse: null | JSON = null;

    try {
      assistantResponse = JSON.parse(messages[0].content);
    } catch (error) {
      console.error('Error parsing assistant response:', error);
      throw new InternalServerErrorException(
        'Error parsing assistant response',
      );
    }

    return {
      runId: run.id,
      status: check.status,
      startedAt: check.startedAt,
      completedAt: check.completedAt,
      model: check.model,
      usage: check.usage,
      userMessage: question,
      assistantResponse: assistantResponse,
      messages,
    };
  }
}
