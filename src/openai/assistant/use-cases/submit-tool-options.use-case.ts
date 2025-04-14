import { InternalServerErrorException } from '@nestjs/common';
import * as dayjs from 'dayjs'
import OpenAI from 'openai';

interface Props {
  threadId: string;
  runId: string;
  submitFunction: Function;
}

export const submitToolOptionsUseCase = async (
  openai: OpenAI,
  props: Props,
) => {
  const { threadId, runId, submitFunction } = props;
  try {
    let runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
    console.log('Run status:', runStatus);
    let maxAttempts = 60; // Máximo 60 intentos (aproximadamente 60 segundos en total)
    let attempts = 0;
    while (
      ['in_progress', 'queued', 'requires_action'].includes(runStatus.status) &&
      attempts < maxAttempts
    ) {
      attempts++;

      if (
        runStatus.status === 'requires_action' &&
        runStatus.required_action?.type === 'submit_tool_outputs'
      ) {
        const toolCalls =
          runStatus.required_action.submit_tool_outputs.tool_calls;
        const toolOutputs: { tool_call_id: string; output: string }[] = [];

        for (const toolCall of toolCalls) {
          if (toolCall.function.name === 'searchDistrict') {
            const functionArgs = JSON.parse(toolCall.function.arguments);
            const district = await submitFunction(functionArgs.name);

            let response;
            if (district) {
              response = {
                districtId: district.districtId,
                name: district.distNmE || district.distNmG,
              };
            } else {
              response = {
                message: 'No se encontró ningún distrito con ese nombre',
              };
            }

            toolOutputs.push({
              tool_call_id: toolCall.id,
              output: JSON.stringify(response),
            });
          }
        }

        runStatus = await openai.beta.threads.runs.submitToolOutputs(
          threadId,
          runId,
          { tool_outputs: toolOutputs },
        );

        attempts = 0;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
        console.log('Run status:', runStatus);
      }
    }

    if (runStatus.status !== 'completed') {
      console.warn(`Run finalizó con estado: ${runStatus.status}`);
      if (runStatus.status === 'failed') {
        throw new InternalServerErrorException(
          `Run failed: ${runStatus.last_error?.message || 'Unknown error'}`,
        );
      }
      if (attempts >= maxAttempts) {
        throw new InternalServerErrorException(
          'Timeout waiting for run to complete',
        );
      }
    }
    return {
      id: runStatus.id,
      assistantId: runStatus.assistant_id,
      status: runStatus.status,
      startedAt:
        dayjs(runStatus.created_at).format('YYYY-MM-DD HH:mm:ss') || '',
      completedAt:
        dayjs(runStatus.created_at).format('YYYY-MM-DD HH:mm:ss') || '',
      model: runStatus.model,
      usage: runStatus.usage || null,
    };
  } catch (error) {
    console.error('Error checking run status:', error);
    throw new InternalServerErrorException('Error checking run status');
  }
};
