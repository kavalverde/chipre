import {
  BadRequestException,
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

  async findParcelByIdDistIdMunicipalitiesAndIdQuarter({
    idMunicipality,
    idDistrict,
    idQuarter,
  }: {
    idMunicipality: number;
    idDistrict: number;
    idQuarter: number;
  }): Promise<Parcel[]> {
    if (!idMunicipality || !idDistrict) {
      throw new BadRequestException('Municipality and District IDs cannot be empty');
    }
    try {
      const quarters = await this.createQueryBuilder('quarter')
        .where('quarter.mun_id = :idMunicipality', { idMunicipality })
        .andWhere('quarter.dist_id = :idDistrict', { idDistrict })
        .andWhere('quarter.qrtr_code = :idQuarter', { idQuarter })
        .getMany();
      return quarters;
    } catch (error) {
      console.error('Error finding quarters by municipality and district:', error);
      throw new InternalServerErrorException('Error finding quarters by municipality and district');
    }
  }
}
