import { InternalServerErrorException } from '@nestjs/common';
import * as dayjs from 'dayjs';
import OpenAI from 'openai';

interface Props {
  threadId: string;
  runId: string;
  toolFunctions: Record<string, Function>;
}

export const submitToolOptionsUseCase = async (
  openai: OpenAI,
  props: Props,
) => {
  const { threadId, runId, toolFunctions } = props;
  try {
    let runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
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
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);

          if (toolFunctions[functionName]) {
            try {
              // Ejecutar la función correspondiente con los argumentos proporcionados
              const result = await toolFunctions[functionName](
                functionArgs.name ? functionArgs.name : functionArgs,
              );

              toolOutputs.push({
                tool_call_id: toolCall.id,
                output: JSON.stringify(
                  result || {
                    message: `No se encontraron resultados para ${functionName}`,
                  },
                ),
              });
            } catch (error) {
              console.error(
                `Error ejecutando la función ${functionName}:`,
                error,
              );
              toolOutputs.push({
                tool_call_id: toolCall.id,
                output: JSON.stringify({
                  error: true,
                  message: `Error al ejecutar ${functionName}: ${error.message}`,
                }),
              });
            }
          } else {
            console.warn(`Función no implementada: ${functionName}`);
            toolOutputs.push({
              tool_call_id: toolCall.id,
              output: JSON.stringify({
                error: true,
                message: `Función no implementada: ${functionName}`,
              }),
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
