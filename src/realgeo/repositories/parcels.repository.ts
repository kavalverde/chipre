import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Parcel } from '../entities';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class ParcersRepository extends Repository<Parcel> {
  constructor(private readonly dataSource: DataSource) {
    super(Parcel, dataSource.createEntityManager());
  }

  async findParcelByRegistrationNumber(registrationNumber: string) {
    try {
      console.log(`Buscando parcela con número de registro: ${registrationNumber}`);
      
      // Buscar la parcela por su número de registro
      const parcel = await this.createQueryBuilder('parcel')
        .where('parcel.pr_registration_no = :registrationNumber', { registrationNumber })
        .getOne();
      
      if (parcel) {
        console.log(`Parcela encontrada: ID=${parcel.parcelId}, Distrito=${parcel.distCode}, Municipalidad=${parcel.vilCode}, Barrio=${parcel.qrtrCode}`);
      } else {
        console.log('No se encontró ninguna parcela con ese número de registro');
      } 
      return parcel;
    } catch (error) {
      console.error('Error buscando parcela por número de registro:', error);
      throw new InternalServerErrorException('Error buscando parcela por número de registro');
    }
  }

  async findParcelsByDistrictAndMunicipality(distCode: number, vilCode: number, qrtrCode?: number): Promise<Parcel[]> {
    try {
      const query = this.createQueryBuilder('parcel')
        .where('parcel.dist_code = :distCode', { distCode })
        .andWhere('parcel.vil_code = :vilCode', { vilCode });
      
      // Si se proporciona el código de barrio, incluirlo en la consulta
      if (qrtrCode) {
        query.andWhere('parcel.qrtr_code = :qrtrCode', { qrtrCode });
      }
      
      const parcels = await query.getMany();
      
      console.log(`Encontradas ${parcels.length} parcelas para distrito ${distCode}, municipalidad ${vilCode}${qrtrCode ? ', barrio ' + qrtrCode : ''}`);
      
      return parcels;
    } catch (error) {
      console.error('Error buscando parcelas:', error);
      throw new InternalServerErrorException('Error buscando parcelas');
    }
  }
}
