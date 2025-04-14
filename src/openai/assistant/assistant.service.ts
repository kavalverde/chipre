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
  submitToolOptionsUseCase,
} from './use-cases';
import { QuestionDto } from './dto';
import { DistrictRepository } from 'src/realgeo/repositories/districts.repository';

@Injectable()
export class AssistantService {
  constructor(
    @Inject(OPENAI_INSTANCE) private readonly openai: OpenAI,
    private readonly districtRepository: DistrictRepository,
  ) {}

  async createThread() {
    const thread = await createThreadUseCase(this.openai);
    return {
      threadId: thread,
    };
  }

  async findDistrictByName(name: string) {
    try {
      const districts = await this.districtRepository.findLikeName(name);
      if (districts && districts.length > 0) {
        // Ordenamos por relevancia - podemos asumir que el nombre más corto que contiene
        // la búsqueda es probablemente el más relevante
        const sortedDistricts = districts.sort(
          (a, b) => (a.distNmE?.length || 999) - (b.distNmE?.length || 999),
        );
        return sortedDistricts[0];
      }
      return null;
    } catch (error) {
      console.error('Error buscando distrito:', error);
      throw new InternalServerErrorException('Error buscando distrito');
    }
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

    const check = await submitToolOptionsUseCase(
      this.openai,
      {
        threadId,
        runId: run.id,
        submitFunction: this.findDistrictByName.bind(this),
      },
    )

  /*   const check = await checkCompleteStatusUseCase(this.openai, {
      runId: run.id,
      threadId,
    }); */

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
