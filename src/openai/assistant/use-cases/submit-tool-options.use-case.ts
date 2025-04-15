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
    
    // Log para diagnóstico
    console.log('Run inicial:', JSON.stringify({
      id: runStatus.id,
      status: runStatus.status,
      required_action: runStatus.required_action ? {
        type: runStatus.required_action.type,
        tool_calls_count: runStatus.required_action.submit_tool_outputs?.tool_calls.length
      } : null
    }));
    
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

        console.log(`Procesando ${toolCalls.length} tool calls`);
        
        for (const toolCall of toolCalls) {
          const functionName = toolCall.function.name;
          let functionArgs;
          
          try {
            functionArgs = JSON.parse(toolCall.function.arguments);
          } catch (error) {
            console.error(`Error parseando argumentos de función ${functionName}:`, error);
            toolOutputs.push({
              tool_call_id: toolCall.id,
              output: JSON.stringify({ 
                error: true,
                message: `Error parseando argumentos: ${error.message}` 
              }),
            });
            continue;
          }

          console.log(`Ejecutando función ${functionName} con args:`, functionArgs);
          
          if (toolFunctions[functionName]) {
            try {
              // Ejecutar la función correspondiente con los argumentos proporcionados
              const funcResult = await toolFunctions[functionName](
                functionName === 'searchDistrict' || functionName === 'searchMunicipality' 
                  ? functionArgs.name 
                  : functionArgs
              );
              
              const result = funcResult || { 
                message: `No se encontraron resultados para ${functionName}` 
              };
              
              console.log(`Resultado de ${functionName}:`, result);
              
              toolOutputs.push({
                tool_call_id: toolCall.id,
                output: JSON.stringify(result),
              });
            } catch (error) {
              console.error(`Error ejecutando la función ${functionName}:`, error);
              toolOutputs.push({
                tool_call_id: toolCall.id,
                output: JSON.stringify({ 
                  error: true,
                  message: `Error al ejecutar ${functionName}: ${error.message}` 
                }),
              });
            }
          } else {
            console.warn(`Función no implementada: ${functionName}`);
            toolOutputs.push({
              tool_call_id: toolCall.id,
              output: JSON.stringify({ 
                error: true,
                message: `Función no implementada: ${functionName}` 
              }),
            });
          }
        }

        console.log('Enviando tool outputs:', toolOutputs);
        
        // Enviamos los resultados a OpenAI
        try {
          runStatus = await openai.beta.threads.runs.submitToolOutputs(
            threadId,
            runId,
            { tool_outputs: toolOutputs },
          );
        } catch (error) {
          console.error('Error enviando tool outputs:', error);
          throw new InternalServerErrorException(
            `Error enviando resultados de herramientas: ${error.message}`
          );
        }

        attempts = 0; // Reiniciamos contador tras enviar herramientas
      } else {
        // Esperamos y volvemos a verificar
        await new Promise((resolve) => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
      }
    }

    if (runStatus.status !== 'completed') {
      console.warn(`Run finalizó con estado: ${runStatus.status}`);
      if (runStatus.status === 'failed') {
        const errorMessage = runStatus.last_error?.message || 'Unknown error';
        console.error(`Run failed: ${errorMessage}`);
        throw new InternalServerErrorException(`Run failed: ${errorMessage}`);
      }
      if (attempts >= maxAttempts) {
        throw new InternalServerErrorException('Timeout waiting for run to complete');
      }
    }
    return {
      id: runStatus.id,
      assistantId: runStatus.assistant_id,
      status: runStatus.status,
      startedAt:
        dayjs(runStatus.created_at).format('YYYY-MM-DD HH:mm:ss') || '',
      completedAt:
        dayjs(runStatus.completed_at || runStatus.created_at).format('YYYY-MM-DD HH:mm:ss') || '',
      model: runStatus.model,
      usage: runStatus.usage || null,
    };
  } catch (error) {
    console.error('Error checking run status:', error);
    throw new InternalServerErrorException(
      `Error checking run status: ${error.message}`
    );
  }
};