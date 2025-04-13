import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { Building } from './buildings.entity';

@Entity('parcels')
export class Parcel {
  @PrimaryColumn({ name: 'parcel_id' })
  parcelId: number;

  @Column({ name: 'dist_code', nullable: true })
  distCode: number;

  @Column({ name: 'vil_code', nullable: true })
  vilCode: number;

  @Column({ name: 'qrtr_code', nullable: true })
  qrtrCode: number;

  @Column({ name: 'blck_code', nullable: true })
  blckCode: number;

  @Column({ name: 'sheet', nullable: true })
  sheet: number;

  @Column({ name: 'plans', nullable: true })
  plans: string;

  @Column({ name: 'pr_registration_no', nullable: true })
  prRegistrationNo: string;

  @Column({ name: 'plzone', nullable: true })
  plzone: string;

  @Column({ name: 'plzone2', nullable: true })
  plzone2: string;

  @Column({ name: 'plzone3', nullable: true })
  plzone3: string;

  @Column({ name: 'dls_parcel_area', type: 'double', nullable: true })
  dlsParcelArea: number;

  @Column({ name: 'parcel_access_type_dsc', nullable: true })
  parcelAccessTypeDsc: string;

  @Column({ name: 'parcel_shape_dsc', nullable: true })
  parcelShapeDsc: string;

  @Column({ name: 'parcel_view_dsc', nullable: true })
  parcelViewDsc: string;

  @Column({ name: 'property_type', nullable: true })
  propertyType: string;

  @Column({ name: 'prc_price_base1', nullable: true })
  prcPriceBase1: number;

  @Column({ name: 'prc_price_base2', nullable: true })
  prcPriceBase2: number;

  @OneToMany(() => Building, (building) => building.parcel)
  buildings: Building[];
}