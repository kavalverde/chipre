import { Module } from '@nestjs/common';
import { RealgeoService } from './realgeo.service';
import { RealgeoController } from './realgeo.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Building,
  District,
  Municipality,
  Parcel,
  Quarter,
  Unit,
} from './entities';
import { DistrictRepository } from './repositories/districts.repository';
import { MunicipalityRepository } from './repositories/municipalities.repository';
import { ParcersRepository } from './repositories/parcels.repository';
import { QuartersRepository } from './repositories/quarters.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      District,
      Building,
      Municipality,
      Parcel,
      Quarter,
      Unit,
    ]),
  ],
  controllers: [RealgeoController],
  providers: [
    RealgeoService,
    DistrictRepository,
    MunicipalityRepository,
    ParcersRepository,
    QuartersRepository,
  ],
  exports: [
    RealgeoService,
    DistrictRepository,
    MunicipalityRepository,
    ParcersRepository,
    QuartersRepository,
  ],
})
export class RealgeoModule {}
