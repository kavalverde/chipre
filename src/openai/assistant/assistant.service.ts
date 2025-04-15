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
import { DistrictRepository } from 'src/realgeo/repositories/districts.repository';
import { MunicipalityRepository } from 'src/realgeo/repositories/municipalities.repository';
import { QuartersRepository } from 'src/realgeo/repositories/quarters.repository';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AssistantService {
  constructor(
    @Inject(OPENAI_INSTANCE) private readonly openai: OpenAI,
    private readonly realgeoService: RealgeoService,
    private readonly districtRepository: DistrictRepository,
    private readonly municipalityRepository: MunicipalityRepository,
    private readonly quartersRepository: QuartersRepository,
    private readonly httpService: HttpService,
  ) {}

  async createThread() {
    const thread = await createThreadUseCase(this.openai);
    return {
      threadId: thread,
    };
  }

  async findDistrictByName(name: string) {
    try {
      // Intentar usar el repositorio directamente
      console.log('Buscando distrito por nombre:', name);
      const districts = await this.districtRepository.findLikeName(name);
      console.log('Districts found:', districts);
      if (districts && districts.length > 0) {
        const sortedDistricts = districts.sort(
          (a, b) => (a.distNmE?.length || 999) - (b.distNmE?.length || 999),
        );
        return {
          districtId: sortedDistricts[0].districtId,
          distCode: sortedDistricts[0].districtId,
          name: sortedDistricts[0].distNmE || sortedDistricts[0].distNmG,
        };
      }
      return { message: "No se encontraron distritos con ese nombre" };
    } catch (error) {
      console.error('Error buscando distrito:', error);
      // En caso de error, devolver un objeto con un mensaje de error
      return { error: true, message: "Error al buscar distrito" };
    }
  }

  async findMunicipalityByName(name: string) {
    try {
      console.log('Buscando municipalidad por nombre:', name);
      const municipalities = await this.municipalityRepository.findMunicipalityOrVillageLikeName(name);
      console.log('Municipalities found:', municipalities);
      if (municipalities && municipalities.length > 0) {
        const sortedMunicipalities = municipalities.sort(
          (a, b) => (a.vilNmE?.length || 999) - (b.vilNmE?.length || 999),
        );
        return {
          municipalityId: sortedMunicipalities[0].vilCode,
          vilCode: sortedMunicipalities[0].vilCode,
          name: sortedMunicipalities[0].vilNmE || sortedMunicipalities[0].vilNmG,
        };
      }
      return { message: "No se encontraron municipalidades con ese nombre" };
    } catch (error) {
      console.error('Error buscando municipalidad:', error);
      return { error: true, message: "Error al buscar municipalidad" };
    }
  }

  async findQuarterByName(params: { districtCode: number; vilCode: number; name: string }) {
    try {
      const { districtCode, vilCode, name } = params;
      console.log('Buscando barrio por nombre:', name);
      console.log('District code:', districtCode);
      console.log('Municipality code:', vilCode);
      const quarters = await this.quartersRepository.createQueryBuilder('quarter')
        .where('quarter.dist_code = :distCode', { distCode: districtCode })
        .andWhere('quarter.vil_code = :vilCode', { vilCode })
        .andWhere('quarter.quarters_e LIKE :name OR quarter.qrtr_nm_g LIKE :name', { name: `%${name}%` })
        .getMany();
      console.log('Quarters found:', quarters);
      if (quarters && quarters.length > 0) {
        return {
          quarterCode: quarters[0].qrtrCode,
          name: quarters[0].quartersE || quarters[0].qrtrNmG,
        };
      }
      return { message: "No se encontraron barrios con esos criterios" };
    } catch (error) {
      console.error('Error buscando quarter:', error);
      return { error: true, message: "Error al buscar barrio" };
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
      // Si el servicio está disponible, usarlo
      if (this.realgeoService && typeof this.realgeoService.searchRealEstate === 'function') {
        return await this.realgeoService.searchRealEstate(params);
      }
      
      // Como alternativa, implementar la lógica aquí
      const { distCode, vilCode, qrtrCode, regblock, regno } = params;
      const url = `https://rest.gisrealestate.com/api/search/searchreg?dist_code=${distCode}&vil_code=${vilCode}&qrtr_code=${qrtrCode}&regblock=${regblock}&regno=${regno}&source=db&cw=1&uw=1`;
      
      const response = await lastValueFrom(
        this.httpService.get(url, {
          headers: {
            'X-Access-Token': process.env.GIS_REALESTATE_API_KEY,
          },
        }),
      );
      
      return response.data;
    } catch (error) {
      console.error('Error consultando API de GIS Real Estate:', error);
      return { error: true, message: "Error al consultar la API de GIS Real Estate" };
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
        },
        {
          type: "function",
          function: {
            name: "searchMunicipality",
            description: "Busca una municipalidad por nombre y devuelve la más relevante",
            parameters: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "El nombre de la municipalidad a buscar"
                }
              },
              required: ["name"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "searchQuarter",
            description: "Busca un barrio (quarter) por nombre en un distrito y municipalidad específicos",
            parameters: {
              type: "object",
              properties: {
                districtCode: {
                  type: "number",
                  description: "El código del distrito"
                },
                vilCode: {
                  type: "number",
                  description: "El código de la municipalidad"
                },
                name: {
                  type: "string",
                  description: "El nombre del barrio (quarter) a buscar"
                }
              },
              required: ["districtCode", "vilCode", "name"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "searchRealEstate",
            description: "Busca propiedades inmobiliarias usando los códigos proporcionados",
            parameters: {
              type: "object",
              properties: {
                distCode: {
                  type: "number",
                  description: "El código del distrito"
                },
                vilCode: {
                  type: "number",
                  description: "El código de la municipalidad"
                },
                qrtrCode: {
                  type: "number",
                  description: "El código del barrio (quarter)"
                },
                regblock: {
                  type: "number",
                  description: "El bloque de registro"
                },
                regno: {
                  type: "number",
                  description: "El número de registro"
                }
              },
              required: ["distCode", "vilCode", "qrtrCode", "regblock", "regno"]
            }
          }
        }
      ] 
    });
    
    if (!run) {
      throw new InternalServerErrorException('Error creating run');
    }

    const check = await submitToolOptionsUseCase(
      this.openai,
      {
        threadId,
        runId: run.id,
        toolFunctions: {
          searchDistrict: this.findDistrictByName.bind(this),
          searchMunicipality: this.findMunicipalityByName.bind(this),
          searchQuarter: this.findQuarterByName.bind(this),
          searchRealEstate: this.searchRealEstate.bind(this),
        },
      },
    );

    const messages = await getMessageListUseCase(this.openai, { threadId });

    let assistantResponse:any = null;

    try {
      assistantResponse = JSON.parse(messages[0].content);
    } catch (error) {
      console.error('Error parsing assistant response:', error);
      assistantResponse = { message: messages[0].content };
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