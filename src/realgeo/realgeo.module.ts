import { Module } from '@nestjs/common';
import { RealgeoService } from './realgeo.service';
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
import { HttpModule } from '@nestjs/axios';

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
    HttpModule
  ],
  providers: [
    DistrictRepository,
    MunicipalityRepository,
    ParcersRepository,
    QuartersRepository,
    RealgeoService,
  ],
  exports: [
    DistrictRepository,
    MunicipalityRepository,
    ParcersRepository,
    QuartersRepository,
    RealgeoService,
  ],
})
export class RealgeoModule {}
