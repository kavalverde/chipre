import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Quarter } from '../entities';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class QuartersRepository extends Repository<Quarter> {
  constructor(private readonly dataSource: DataSource) {
    super(Quarter, dataSource.createEntityManager());
  }

  async findQuarterByMunicipalityAndDistrict({
    idMunicipality,
    idDistrict,
  }: {
    idMunicipality: number;
    idDistrict: number;
  }): Promise<Quarter[]> {
    if (!idMunicipality || !idDistrict) {
      throw new BadRequestException('Municipality and District IDs cannot be empty');
    }
    try {
      const quarters = await this.createQueryBuilder('quarter')
        .where('quarter.mun_id = :idMunicipality', { idMunicipality })
        .andWhere('quarter.dist_id = :idDistrict', { idDistrict })
        .getMany();
      return quarters;
    } catch (error) {
      console.error('Error finding quarters by municipality and district:', error);
      throw new InternalServerErrorException('Error finding quarters by municipality and district');
    }
  }
}
