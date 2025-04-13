import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { Municipality } from './municipalities.entity';

@Entity('districts')
export class District {
  @PrimaryColumn({ name: 'district_id' })
  districtId: number;

  @Column({ name: 'dist_nm_e', nullable: true })
  distNmE: string;

  @Column({ name: 'dist_nm_g', nullable: true })
  distNmG: string;

  @OneToMany(() => Municipality, (municipality) => municipality.district)
  municipalities: Municipality[];
}