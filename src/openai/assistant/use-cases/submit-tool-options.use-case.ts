import { InternalServerErrorException } from '@nestjs/common';
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

    // Procesar llamadas a funciones si es necesario
    while (
      runStatus.status === 'requires_action' &&
      runStatus.required_action?.type === 'submit_tool_outputs'
    ) {
      const toolCalls =
        runStatus.required_action.submit_tool_outputs.tool_calls;

      let toolOutputs: { tool_call_id: string; output: string }[] = [];

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
    }
  } catch (error) {
    console.error('Error checking run status:', error);
    throw new InternalServerErrorException('Error checking run status');
  }
};
