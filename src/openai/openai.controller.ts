import { Body, Controller, Get, Post } from '@nestjs/common';
import { OpenaiService } from './openai.service';
import { AssistantService } from './assistant/assistant.service';
import { QuestionDto } from './assistant/dto';

@Controller('openai')
export class OpenaiController {
  constructor(
    private readonly openaiService: OpenaiService,
    private readonly assistantService: AssistantService,
  ) {}

  @Get('assistant/thread')
  createThread() {
    return this.assistantService.createThread();
  }

  @Post('assistant/query')
  executeAssistantQuery(@Body() questionDto: QuestionDto) {
    return this.assistantService.execute(questionDto);
  }
}
