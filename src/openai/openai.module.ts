import { Module } from '@nestjs/common';
import { OpenaiService } from './openai.service';
import { OpenaiController } from './openai.controller';
import { AssistantService } from './assistant/assistant.service';

@Module({
  controllers: [OpenaiController],
  providers: [OpenaiService, AssistantService],
})
export class OpenaiModule {}
