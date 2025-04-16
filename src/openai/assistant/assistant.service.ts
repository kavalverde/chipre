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

      const check = await submitToolOptionsUseCase(this.openai, {
        threadId,
        runId: run.id,
        toolFunctions: {
          searchDistrict: (name) =>
            this.realgeoService.findDistrictByName(name),
          searchMunicipality: (name) =>
            this.realgeoService.findMunicipalityByName(name),
          searchQuarter: (params) =>
            this.realgeoService.findQuarterByName(params),
          searchRealEstate: (params) =>
            this.realgeoService.searchRealEstate(params),
        },
      });

      console.log('Herramientas procesadas, estado:', check.status);

      const messages = await getMessageListUseCase(this.openai, { threadId });
      console.log('Mensajes obtenidos:', messages.length);

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
          messages,
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
