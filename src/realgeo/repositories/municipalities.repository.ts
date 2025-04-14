import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Municipality } from '../entities';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class MunicipalityRepository extends Repository<Municipality> {
  constructor(private readonly dataSource: DataSource) {
    super(Municipality, dataSource.createEntityManager());
  }

  async findMunicipalityOrVillageLikeName(name: string): Promise<Municipality[]> {
    if (!name) {
      throw new BadRequestException('Name cannot be empty');
    }
    try {
      const municipalities = await this.createQueryBuilder('municipality')
        .where('municipality.vil_ccd LIKE :name', { name: `%${name}%` })
        .orWhere('municipality.vil_nm_e LIKE :name', { name: `%${name}%` })
        .orWhere('municipality.vil_nm_e_tag LIKE :name', { name: `%${name}%` })
        .orWhere('municipality.vil_nm_g_tag LIKE :name', { name: `%${name}%` })
        .getMany();
      return municipalities;
    } catch (error) {
      console.error('Error finding municipalities by name:', error);
      throw new InternalServerErrorException('Error finding municipalities by name');
    }
  }
}