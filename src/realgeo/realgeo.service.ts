import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateRealgeoDto } from './dto/create-realgeo.dto';
import { UpdateRealgeoDto } from './dto/update-realgeo.dto';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class RealgeoService {
  districtRepository: any;
  municipalityRepository: any;
  quartersRepository: any;
  httpService: any;
  create(createRealgeoDto: CreateRealgeoDto) {
    return 'This action adds a new realgeo';
  }

  findAll() {
    return `This action returns all realgeo`;
  }

  findOne(id: number) {
    return `This action returns a #${id} realgeo`;
  }

  update(id: number, updateRealgeoDto: UpdateRealgeoDto) {
    return `This action updates a #${id} realgeo`;
  }

  remove(id: number) {
    return `This action removes a #${id} realgeo`;
  }


  async findDistrictByName(name: string) {
    try {
      const districts = await this.districtRepository.findLikeName(name);
      if (districts && districts.length > 0) {
        // Ordenamos por relevancia - podemos asumir que el nombre más corto que contiene
        // la búsqueda es probablemente el más relevante
        const sortedDistricts = districts.sort(
          (a, b) => (a.distNmE?.length || 999) - (b.distNmE?.length || 999),
        );
        return sortedDistricts[0];
      }
      return null;
    } catch (error) {
      console.error('Error buscando distrito:', error);
      throw new InternalServerErrorException('Error buscando distrito');
    }
  }

  async findMunicipalityByName(name: string) {
    try {
      const municipalities = await this.municipalityRepository.findMunicipalityOrVillageLikeName(name);
      if (municipalities && municipalities.length > 0) {
        // Ordenamos por relevancia
        const sortedMunicipalities = municipalities.sort(
          (a, b) => (a.vilNmE?.length || 999) - (b.vilNmE?.length || 999),
        );
        return sortedMunicipalities[0];
      }
      return null;
    } catch (error) {
      console.error('Error buscando municipalidad:', error);
      throw error;
    }
  }

  async findQuarterByName(distCode: number, vilCode: number, name: string) {
    try {
      // Implementar la búsqueda de quarter por nombre
      // Esta es una implementación simplificada, deberías ajustarla según tu modelo de datos
      const quarters = await this.quartersRepository.createQueryBuilder('quarter')
        .where('quarter.dist_code = :distCode', { distCode })
        .andWhere('quarter.vil_code = :vilCode', { vilCode })
        .andWhere('quarter.quarters_e LIKE :name OR quarter.qrtr_nm_g LIKE :name', { name: `%${name}%` })
        .getMany();
      
      if (quarters && quarters.length > 0) {
        return quarters[0];
      }
      return null;
    } catch (error) {
      console.error('Error buscando quarter:', error);
      throw error;
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
      const { distCode, vilCode, qrtrCode, regblock, regno } = params;

      // Construir URL para la API externa
      const url = `https://rest.gisrealestate.com/api/search/searchreg?dist_code=${distCode}&vil_code=${vilCode}&qrtr_code=${qrtrCode}&regblock=${regblock}&regno=${regno}&source=db&cw=1&uw=1`;
      
      // Hacer solicitud a la API externa
      const response = await lastValueFrom(
        this.httpService.get(url, {
          headers: {
            'X-Access-Token': process.env.GIS_REALESTATE_API_KEY,
          },
        }),
      );
      console.log('Response from GIS Real Estate API:', response);
      return response || null;
    } catch (error) {
      console.error('Error consultando API de GIS Real Estate:', error);
      throw error;
    }
  }
}
