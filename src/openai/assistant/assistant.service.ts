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
import { DistrictRepository } from 'src/realgeo/repositories/districts.repository';

@Injectable()
export class AssistantService {
  municipalityRepository: any;
  quartersRepository: any;
  httpService: any;
  realgeoService: any;
  constructor(
    @Inject(OPENAI_INSTANCE) private readonly openai: OpenAI,
    private readonly districtRepository: DistrictRepository,
  ) {}

  async createThread() {
    const thread = await createThreadUseCase(this.openai);
    return {
      threadId: thread,
    };
  }

  async findDistrictByName(name: string) {
    try {
      const district = await this.realgeoService.findDistrictByName(name);
      if (district) {
        return {
          districtId: district.districtId,
          distCode: district.districtId, // Asumiendo que estos son lo mismo
          name: district.distNmE || district.distNmG,
        };
      }
      return null;
    } catch (error) {
      console.error('Error buscando distrito:', error);
      throw new InternalServerErrorException('Error buscando distrito');
    }
  }

  async findMunicipalityByName(name: string) {
    try {
      const municipality =
        await this.realgeoService.findMunicipalityByName(name);
      if (municipality) {
        return {
          municipalityId: municipality.vilCode,
          vilCode: municipality.vilCode,
          name: municipality.vilNmE || municipality.vilNmG,
        };
      }
      return null;
    } catch (error) {
      console.error('Error buscando municipalidad:', error);
      throw new InternalServerErrorException('Error buscando municipalidad');
    }
  }

  async findQuarterByName(params: {
    districtCode: number;
    vilCode: number;
    name: string;
  }) {
    try {
      const { districtCode, vilCode, name } = params;
      const quarter = await this.realgeoService.findQuarterByName(
        districtCode,
        vilCode,
        name,
      );
      if (quarter) {
        return {
          quarterCode: quarter.qrtrCode,
          name: quarter.quartersE || quarter.qrtrNmG,
        };
      }
      return null;
    } catch (error) {
      console.error('Error buscando quarter:', error);
      throw new InternalServerErrorException('Error buscando quarter');
    }
  }

  async searchRealEstate(params: {
    distCode: number;
    vilCode: number;
    qrtrCode: number;
    regblock: number;
    regno: number;
  }) {
    try {
      const result = await this.realgeoService.searchRealEstate(params);
      return result;
    } catch (error) {
      console.error('Error consultando API de GIS Real Estate:', error);
      throw new InternalServerErrorException(
        'Error consultando API de GIS Real Estate',
      );
    }
  }

  async execute(questionDto: QuestionDto) {
    const { threadId, question, assistantId } = questionDto;

    const message = await createMessageUseCase(this.openai, {
      threadId,
      question,
    });
    if (!message) {
      throw new InternalServerErrorException('Error creating message');
    }
    const run = await createRunUseCase(this.openai, {
      assistantId,
      threadId,
      tools: [
        {
          type: 'function',
          function: {
            name: 'searchDistrict',
            description:
              'Busca un distrito por nombre y devuelve el más relevante',
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
            description:
              'Busca una municipalidad por nombre y devuelve la más relevante',
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
              'Busca un barrio (quarter) por nombre en un distrito y municipalidad específicos',
            parameters: {
              type: 'object',
              properties: {
                districtCode: {
                  type: 'number',
                  description: 'El código del distrito',
                },
                vilCode: {
                  type: 'number',
                  description: 'El código de la municipalidad',
                },
                name: {
                  type: 'string',
                  description: 'El nombre del barrio (quarter) a buscar',
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
                  description: 'El código del barrio (quarter)',
                },
                regblock: {
                  type: 'number',
                  description: 'El bloque de registro',
                },
                regno: {
                  type: 'number',
                  description: 'El número de registro',
                },
              },
              required: [
                'distCode',
                'vilCode',
                'qrtrCode',
                'regblock',
                'regno',
              ],
            },
          },
        },
      ],
    });
    if (!run) {
      throw new InternalServerErrorException('Error creating run');
    }

    const check = await submitToolOptionsUseCase(this.openai, {
      threadId,
      runId: run.id,
      toolFunctions: {
        searchDistrict: this.findDistrictByName.bind(this),
        searchMunicipality: this.findMunicipalityByName.bind(this),
        searchQuarter: this.findQuarterByName.bind(this),
        searchRealEstate: this.searchRealEstate.bind(this),
      },
    });

    /*   const check = await checkCompleteStatusUseCase(this.openai, {
      runId: run.id,
      threadId,
    }); */

    const messages = await getMessageListUseCase(this.openai, { threadId });

    let assistantResponse: null | JSON = null;

    try {
      assistantResponse = JSON.parse(messages[0].content);
    } catch (error) {
      console.error('Error parsing assistant response:', error);
      throw new InternalServerErrorException(
        'Error parsing assistant response',
      );
    }

    return {
      runId: run.id,
      status: check.status,
      startedAt: check.startedAt,
      completedAt: check.completedAt,
      model: check.model,
      usage: check.usage,
      userMessage: question,
      assistantResponse: assistantResponse,
      messages,
    };
  }
}
