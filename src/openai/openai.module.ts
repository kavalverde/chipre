import { Module } from '@nestjs/common';
import { OpenaiService } from './openai.service';
import { OpenaiController } from './openai.controller';
import { AssistantService } from './assistant/assistant.service';
import { OpenaiProvider } from './providers/openai.provider';
import { RealgeoModule } from 'src/realgeo/realgeo.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [RealgeoModule, HttpModule],
  controllers: [OpenaiController],
  providers: [OpenaiProvider, OpenaiService, AssistantService],
  exports: [OpenaiService],
})
export class OpenaiModule {}
