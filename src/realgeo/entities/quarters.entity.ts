import { Entity, Column} from 'typeorm';

@Entity('quarters')
export class Quarter {
  @Column({ name: 'dist_code', nullable: true })
  distCode: number;

  @Column({ name: 'vil_code', nullable: true })
  vilCode: number;

  @Column({ name: 'qrtr_code', nullable: true, primary: true })
  qrtrCode: number;

  @Column({ name: 'quarters_e', nullable: true })
  quartersE: string;

  @Column({ name: 'qrtr_nm_g', nullable: true })
  qrtrNmG: string;
}