import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { District } from '../entities';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class DistrictRepository extends Repository<District> {
  constructor(private readonly dataSource: DataSource) {
    super(District, dataSource.createEntityManager());
  }

  async findLikeName(name: string): Promise<District[]> {
    if (!name) {
      throw new BadRequestException('Name cannot be empty');
    }
    try {
      const districts = await this.createQueryBuilder('district')
        .where('district.dist_nm_e LIKE :name', { name: `%${name}%` })
        .getMany();
      return districts;
    } catch (error) {
      console.error('Error finding districts by name:', error);
      throw new InternalServerErrorException('Error finding districts by name');
    }
  }
}
