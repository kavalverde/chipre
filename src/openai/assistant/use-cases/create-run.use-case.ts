import { InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';

interface Props {
  threadId: string;
  assistantId: string;
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
  const { threadId, assistantId } = props;

  try {
    if (!threadId || !assistantId) {
      throw new Error('Thread ID and Assistant ID are required');
    }
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
      tools: [
        {
          type: "function",
          function: {
            name: "searchDistrict",
            description: "Busca un distrito por nombre y devuelve el más relevante",
            parameters: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "El nombre del distrito a buscar"
                }
              },
              required: ["name"]
            }
          }
        }
      ],
      response_format: {
        type: "json_object"
      }
    });
    if (!run) {
      throw new Error('Error creating run');
    }
    return run;
  } catch (error) {
    console.error(error);
    throw new InternalServerErrorException('Error creating run');
  }
};
