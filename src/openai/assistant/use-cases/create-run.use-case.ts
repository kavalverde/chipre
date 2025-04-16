import { InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';

interface Props {
  threadId: string;
  assistantId: string;
  tools?: any[];
}
export interface Run {
  id: string;
  assistantId: string;
  status: string;
  startedAt: string;
  completedAt: string;
  model: string;
  usage: OpenAI.Beta.Threads.Runs.Run.Usage;
}

export const createRunUseCase = async (
  openai: OpenAI,
  props: Props,
): Promise<OpenAI.Beta.Threads.Runs.Run> => {
  const { threadId, assistantId, tools } = props;

  try {
    if (!threadId || !assistantId) {
      throw new Error('Thread ID and Assistant ID are required');
    }
    
    const runOptions: any = {
      assistant_id: assistantId,
      response_format: {
        type: "json_object"
      },
    };
    
    if (tools && tools.length > 0) {
      runOptions.tools = tools;
    }
    
    const run = await openai.beta.threads.runs.create(threadId, runOptions);
    
    if (!run) {
      throw new Error('Error creating run');
    }
    
    return run;
  } catch (error) {
    console.error(error);
    throw new InternalServerErrorException('Error creating run');
  }
};