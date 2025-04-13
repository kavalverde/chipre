import { InternalServerErrorException } from '@nestjs/common';
import * as dayjs from 'dayjs'
import OpenAI from 'openai';

interface Props {
  threadId: string;
  runId: string;
}

interface Run {
  id: string;
  assistantId: string;
  status: string;
  startedAt: string;
  completedAt: string;
  model: string;
  usage: OpenAI.Beta.Threads.Runs.Run.Usage | null;
}

export const checkCompleteStatusUseCase = async (
  openai: OpenAI,
  props: Props,
  
):Promise<Run> => {
  const { threadId, runId } = props;
  try {
    let runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
  
    if (runStatus.status === 'completed') {
     return {
           id: runStatus.id,
           assistantId: runStatus.assistant_id,
           status: runStatus.status,
           startedAt: dayjs(runStatus.created_at).format('YYYY-MM-DD HH:mm:ss') || "",
           completedAt: dayjs(runStatus.created_at).format('YYYY-MM-DD HH:mm:ss') || "",
           model: runStatus.model,
           usage: runStatus.usage || null,
         }
    }
  
    await new Promise((resolve) => setTimeout(resolve, 1000));
  
    return await checkCompleteStatusUseCase(openai, props);
    
  } catch (error) {
    console.error('Error checking run status:', error);
    throw new InternalServerErrorException('Error checking run status');
  }

};
