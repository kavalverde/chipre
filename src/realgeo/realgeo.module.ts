import { Module } from '@nestjs/common';
import { RealgeoService } from './realgeo.service';
import { RealgeoController } from './realgeo.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Building, District, Municipality, Parcel, Quarter, Unit } from './entities';


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
  providers: [RealgeoService],
})
export class RealgeoModule {}
