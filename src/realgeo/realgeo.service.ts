import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { DistrictRepository } from 'src/realgeo/repositories/districts.repository';
import { MunicipalityRepository } from 'src/realgeo/repositories/municipalities.repository';
import { QuartersRepository } from 'src/realgeo/repositories/quarters.repository';
import { ParcersRepository } from './repositories/parcels.repository';

@Injectable()
export class RealgeoService {
  constructor(
    private readonly districtRepository: DistrictRepository,
    private readonly municipalityRepository: MunicipalityRepository,
    private readonly quartersRepository: QuartersRepository,
    private readonly httpService: HttpService,
    private readonly parcelsRepository: ParcersRepository,
  ) {}

  async findDistrictByName(name: string) {
    try {
      console.log('Buscando distrito por nombre:', name);
      const districts = await this.districtRepository.findLikeName(name);
      console.log('Distritos encontrados:', districts);

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
      return {
        success: false,
        message: 'No se encontraron distritos con ese nombre',
      };
    } catch (error) {
      console.error('Error buscando distrito:', error);
      return {
        success: false,
        message: 'Error al buscar distrito',
        error: error.message,
      };
    }
  }

  async findMunicipalityByName(name: string) {
    try {
      console.log('Buscando municipalidad por nombre:', name);
      const municipalities =
        await this.municipalityRepository.findMunicipalityOrVillageLikeName(
          name,
        );
      console.log('Municipalidades encontradas:', municipalities);

      if (municipalities && municipalities.length > 0) {
        const sortedMunicipalities = municipalities.sort(
          (a, b) => (a.vilNmE?.length || 999) - (b.vilNmE?.length || 999),
        );
        return {
          municipalityId: sortedMunicipalities[0].vilCode,
          vilCode: sortedMunicipalities[0].vilCode,
          name:
            sortedMunicipalities[0].vilNmE || sortedMunicipalities[0].vilNmG,
        };
      }
      return {
        success: false,
        message: 'No se encontraron municipalidades con ese nombre',
      };
    } catch (error) {
      console.error('Error buscando municipalidad:', error);
      return {
        success: false,
        message: 'Error al buscar municipalidad',
        error: error.message,
      };
    }
  }

  async findQuarterByName(params: {
    districtCode: number;
    vilCode: number;
    name: string;
  }) {
    try {
      const { districtCode, vilCode, name } = params;
      console.log('Buscando barrio por nombre:', name);
      console.log('Distrito:', districtCode);
      console.log('Municipalidad:', vilCode);

      const quarters = await this.quartersRepository
        .createQueryBuilder('quarter')
        .where('quarter.dist_code = :distCode', { distCode: districtCode })
        .andWhere('quarter.vil_code = :vilCode', { vilCode })
        .andWhere(
          'quarter.quarters_e LIKE :name OR quarter.qrtr_nm_g LIKE :name',
          { name: `%${name}%` },
        )
        .getMany();

      console.log('Barrios encontrados:', quarters);

      if (quarters && quarters.length > 0) {
        return {
          quarterCode: quarters[0].qrtrCode,
          qrtrCode: quarters[0].qrtrCode,
          name: quarters[0].quartersE || quarters[0].qrtrNmG,
        };
      }
      return {
        success: false,
        message: 'No se encontraron barrios con esos criterios',
      };
    } catch (error) {
      console.error('Error buscando barrio:', error);
      return {
        success: false,
        message: 'Error al buscar barrio',
        error: error.message,
      };
    }
  }

  async searchRealEstate(params: {
    distCode: number;
    vilCode: number;
    qrtrCode: number;
    registrationNumber: string;
  }) {
    try {
      console.log('Buscando propiedad con parámetros:', params);

      const { distCode, vilCode, qrtrCode, registrationNumber } = params;

      // Verificar que los parámetros necesarios estén presentes
      if (
        distCode === null ||
        distCode === undefined ||
        vilCode === null ||
        vilCode === undefined ||
        qrtrCode === null ||
        qrtrCode === undefined ||
        !registrationNumber
      ) {
        return {
          success: false,
          message: 'Faltan parámetros obligatorios para la búsqueda',
        };
      }

      // Extraer bloque y número de registro
      let regblock = 0;
      let regno = 0;

      if (registrationNumber && registrationNumber.includes('/')) {
        // Extraer los componentes del número de registro
        const parts = registrationNumber.split('/');
        regblock = parseInt(parts[0], 10) || 0;
        regno = parseInt(parts[1], 10) || 0;
      } else {
        // Si no tiene formato con barra, intentar usar como número de registro
        regno = parseInt(registrationNumber, 10) || 0;
      }

      // Buscar la parcela en la base de datos para obtener el blckCode correcto
      const parcel = await this.parcelsRepository.findOne({
        where: {
          distCode: distCode,
          vilCode: vilCode,
          qrtrCode: qrtrCode,
          prRegistrationNo: registrationNumber,
        },
      });

      // Si se encuentra la parcela, utilizar su blckCode para el regblock
      if (parcel) {
        console.log('Parcela encontrada en la base de datos:', parcel);
        regblock = parcel.blckCode || regblock;
      } else {
        console.log(
          'No se encontró la parcela en la base de datos, usando valores proporcionados',
        );
      }

      console.log('Datos procesados para la búsqueda:');
      console.log('Distrito:', distCode);
      console.log('Municipalidad:', vilCode);
      console.log('Barrio:', qrtrCode);
      console.log('Bloque de Registro:', regblock);
      console.log('Número de Registro:', regno);

      // Construir URL para la API externa
      const url = `https://rest.gisrealestate.com/api/search/searchreg?dist_code=${distCode}&vil_code=${vilCode}&qrtr_code=${qrtrCode}&regblock=${regblock}&regno=${regno}&source=db&cw=1&uw=1`;

      console.log('URL de consulta:', url);

      // Hacer solicitud a la API externa
      const response = await lastValueFrom(
        this.httpService.get(url, {
          headers: {
            'X-Access-Token':
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzQ0NzY5MDE3LCJleHAiOjE3NDQ4NTU0MTd9.EwOwtq6HidCurDlGxtOpY76cVKgJ2hSYBi_cPFacGW8',
          },
        }),
      );

      const data = response.data;
      console.log('Respuesta recibida de la API de GIS Real Estate');

      // Procesar la respuesta
      if (data) {
        return {
          success: true,
          propertyDetails: data || [],
          message: 'Propiedad encontrada con éxito',
          searchParams: {
            distrito: distCode,
            municipalidad: vilCode,
            barrio: qrtrCode,
            registroCompleto: registrationNumber,
            bloque: regblock,
            numeroRegistro: regno,
          },
        };
      } else {
        return {
          success: false,
          message:
            'No se encontraron propiedades con los parámetros proporcionados',
          searchParams: {
            distrito: distCode,
            municipalidad: vilCode,
            barrio: qrtrCode,
            registroCompleto: registrationNumber,
            bloque: regblock,
            numeroRegistro: regno,
          },
        };
      }
    } catch (error) {
      console.error('Error consultando API de GIS Real Estate:', error);
      return {
        success: false,
        message: 'Error al consultar la API de GIS Real Estate',
        error: error.message,
      };
    }
  }
}
