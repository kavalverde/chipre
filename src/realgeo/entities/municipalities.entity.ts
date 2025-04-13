import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { District } from './districts.entity';

@Entity('municipalities')
export class Municipality {
  @Column({ name: 'district_id', nullable: true })
  districtId: number;

  @Column({ name: 'vil_code', nullable: true, primary: true })
  vilCode: number;

  @Column({ name: 'vil_ccd', nullable: true })
  vilCcd: number;

  @Column({ name: 'vil_nm_e', nullable: true })
  vilNmE: string;

  @Column({ name: 'vil_nm_g', nullable: true })
  vilNmG: string;

  @Column({ name: 'vil_nm_e_tag', nullable: true })
  vilNmETag: string;

  @Column({ name: 'vil_nm_g_tag', nullable: true })
  vilNmGTag: string;

  @Column({ name: 'municipality', nullable: true })
  municipality: string;

  @ManyToOne(() => District, (district) => district.municipalities)
  @JoinColumn({ name: 'district_id', referencedColumnName: 'districtId' })
  district: District;
}