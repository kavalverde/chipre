import { Module } from '@nestjs/common';
import { OpenaiService } from './openai.service';
import { OpenaiController } from './openai.controller';
import { AssistantService } from './assistant/assistant.service';
import { OpenaiProvider } from './providers/openai.provider';
import { RealgeoModule } from 'src/realgeo/realgeo.module';

@Module({
  imports: [RealgeoModule],
  controllers: [OpenaiController],
  providers: [OpenaiProvider, OpenaiService, AssistantService],
  exports: [OpenaiService],
})
export class OpenaiModule {}
