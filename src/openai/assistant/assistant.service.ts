import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { OPENAI_INSTANCE } from '../providers/openai.provider';
import OpenAI from 'openai';
import {
  createMessageUseCase,
  createRunUseCase,
  createThreadUseCase,
  getMessageListUseCase,
  submitToolOptionsUseCase,
} from './use-cases';
import { QuestionDto } from './dto';

import { RealgeoService } from 'src/realgeo/realgeo.service';

const ASSISTANT_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'searchDistrict',
      description: 'Busca un distrito por nombre',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'El nombre del distrito a buscar',
          },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'searchMunicipality',
      description: 'Busca una municipalidad por nombre',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'El nombre de la municipalidad a buscar',
          },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'searchQuarter',
      description:
        'Busca un barrio por nombre en un distrito y municipalidad específicos',
      parameters: {
        type: 'object',
        properties: {
          districtCode: {
            type: 'number',
            description: 'El código del distrito (dist_code)',
          },
          vilCode: {
            type: 'number',
            description: 'El código de la municipalidad (vil_code)',
          },
          name: {
            type: 'string',
            description: 'El nombre del barrio a buscar',
          },
        },
        required: ['districtCode', 'vilCode', 'name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'searchRealEstate',
      description:
        'Busca propiedades inmobiliarias usando los códigos proporcionados',
      parameters: {
        type: 'object',
        properties: {
          distCode: {
            type: 'number',
            description: 'El código del distrito',
          },
          vilCode: {
            type: 'number',
            description: 'El código de la municipalidad',
          },
          qrtrCode: {
            type: 'number',
            description: 'El código del barrio',
          },
          registrationNumber: {
            type: 'string',
            description:
              "El número de registro en formato 'bloque/número', por ejemplo '0/522'",
          },
        },
        required: ['distCode', 'vilCode', 'qrtrCode', 'registrationNumber'],
      },
    },
  },
];

@Injectable()
export class AssistantService {
  constructor(
    @Inject(OPENAI_INSTANCE)
    private readonly openai: OpenAI,
    private readonly realgeoService: RealgeoService,
  ) {}

  async createThread() {
    try {
      const thread = await createThreadUseCase(this.openai);
      return {
        success: true,
        message: 'Thread creado exitosamente',
        data: {
          threadId: thread,
        },
      };
    } catch (error) {
      console.error('Error al crear thread:', error);
      throw new InternalServerErrorException('Error al crear thread');
    }
  }

  async execute(questionDto: QuestionDto) {
    try {
      const { threadId, question, assistantId } = questionDto;

      console.log('Creando mensaje con pregunta:', question);
      const message = await createMessageUseCase(this.openai, {
        threadId,
        question,
      });

      if (!message) {
        throw new InternalServerErrorException('Error al crear mensaje');
      }

      console.log('Creando run con asistente:', assistantId);
      const run = await createRunUseCase(this.openai, {
        assistantId,
        threadId,
        tools: ASSISTANT_TOOLS,
      });

      if (!run) {
        throw new InternalServerErrorException('Error al crear run');
      }

      console.log('Run creado, ID:', run.id);
      console.log('Procesando herramientas...');

      // Mantenemos un estado temporal para preservar los resultados entre llamadas a funciones
      let tempState: any = {
        districtInfo: null,
        municipalityInfo: null,
        quarterInfo: null,
      };

      const check = await submitToolOptionsUseCase(this.openai, {
        threadId,
        runId: run.id,
        toolFunctions: {
          searchDistrict: async (name) => {
            const result = await this.realgeoService.findDistrictByName(name);
            if (!result.success) {
              return result;
            }
            // Guardamos en estado temporal
            tempState.districtInfo = result;
            return result;
          },
          searchMunicipality: async (name) => {
            const result =
              await this.realgeoService.findMunicipalityByName(name);
            if (!result.success) {
              return result;
            }
            // Guardamos en estado temporal
            tempState.municipalityInfo = result;
            return result;
          },
          searchQuarter: async (params) => {
            // Validamos que tengamos datos correctos
            const { districtCode, vilCode, name } = params;

            // Si hay datos en el estado temporal, usamos esos en caso de inconsistencias
            const finalDistCode =
              tempState.districtInfo?.distCode || districtCode;
            const finalVilCode = tempState.municipalityInfo?.vilCode || vilCode;

            console.log(
              `Parámetros ajustados: districtCode=${finalDistCode}, vilCode=${finalVilCode}`,
            );

            const result = await this.realgeoService.findQuarterByName({
              districtCode: finalDistCode,
              vilCode: finalVilCode,
              name,
            });

            if (!result.success) {
              // Si no encontramos un barrio, pero tenemos distrito y municipalidad,
              // usamos código 0 como fallback para el barrio
              if (tempState.districtInfo && tempState.municipalityInfo) {
                tempState.quarterInfo = {
                  qrtrCode: 0,
                  quarterCode: 0,
                  name: 'Default',
                };
                return tempState.quarterInfo;
              }
              return result;
            }

            // Guardamos en estado temporal
            tempState.quarterInfo = result;
            return result;
          },
          searchRealEstate: async (params) => {
            let { distCode, vilCode, qrtrCode, registrationNumber } = params;

            // Usamos los datos del estado temporal si disponibles
            distCode = tempState.districtInfo?.distCode || distCode;
            vilCode = tempState.municipalityInfo?.vilCode || vilCode;
            qrtrCode = tempState.quarterInfo?.qrtrCode ?? (qrtrCode || 0);

            console.log(
              `Parámetros finales de búsqueda: distCode=${distCode}, vilCode=${vilCode}, qrtrCode=${qrtrCode}, registrationNumber=${registrationNumber}`,
            );

            // Validamos el formato del número de registro
            if (!registrationNumber.includes('/')) {
              registrationNumber = `0/${registrationNumber}`;
            }

            return this.realgeoService.searchRealEstate({
              distCode,
              vilCode,
              qrtrCode,
              registrationNumber,
            });
          },
        },
      });

      console.log('Herramientas procesadas, estado:', check.status);

      const messages = await getMessageListUseCase(this.openai, { threadId });
      console.log('Mensajes obtenidos:', messages.length);
      console.log('Mensaje:', messages[0].content);


      const sortedMessages = [...messages].reverse();

      // Intentar parsear la respuesta como JSON
      let assistantResponse: any = null;
      try {
        if (messages && messages.length > 0) {
          assistantResponse = JSON.parse(messages[0].content);
        } else {
          assistantResponse = {
            message: 'No se recibió respuesta del asistente',
          };
        }
      } catch (error) {
        console.error('Error al parsear respuesta JSON:', error);
        // Si no es JSON, usar el texto original
        assistantResponse = { message: messages[0].content };
      }

      return {
        success: true,
        message: 'Consulta procesada exitosamente',
        data: {
          runId: run.id,
          status: check.status,
          startedAt: check.startedAt,
          completedAt: check.completedAt,
          model: check.model,
          usage: check.usage,
          userMessage: question,
          assistantResponse: assistantResponse,
          messages: sortedMessages,
        },
      };
    } catch (error) {
      console.error('Error en execute:', error);
      throw new InternalServerErrorException(
        `Error al ejecutar asistente: ${error.message}`,
      );
    }
  }
}

function sanitizeJSON(json: string): string {
  return json
    .trim()
    .replace(/[\u0000-\u001F]+/g, ' ')
    .replace(/,\s*([}\]])/g, '$1') // coma antes de ] o }
    .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
    .replace(/\\"/g, '"');
}

function tryFixMalformedOutput(output: string) {
  try {
    const sanitized = sanitizeJSON(output);
    const parsed = JSON.parse(sanitized);

    if (Array.isArray(parsed.propertyDetails)) {
      const details = parsed.propertyDetails;

      // Detecta si es un array con mezcla de objetos y valores sueltos
      if (Array.isArray(details[0]) && typeof details[0][0] === 'object') {
        // Arreglamos para dejar solo el objeto principal
        parsed.propertyDetails = details[0];
      }
    }

    return parsed;
  } catch (err) {
    console.error('No se pudo reparar JSON:', err.message);
    return null;
  }
}
