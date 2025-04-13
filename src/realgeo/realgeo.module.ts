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
  providers: [RealgeoService, DistrictRepository],
  exports: [RealgeoService, DistrictRepository],
})
export class RealgeoModule {}
