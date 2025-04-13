import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Parcel } from './parcels.entity';
import { Unit } from './units.entity';

@Entity('buildings')
export class Building {
  @PrimaryColumn({ name: 'building_id' })
  buildingId: number;

  @Column({ name: 'bdg_name', nullable: true })
  bdgName: string;

  @Column({ name: 'parcel_id', nullable: true })
  parcelId: number;

  @Column({ name: 'bdg_kind', nullable: true })
  bdgKind: string;

  @ManyToOne(() => Parcel, (parcel) => parcel.buildings)
  @JoinColumn({ name: 'parcel_id' })
  parcel: Parcel;

  @OneToMany(() => Unit, (unit) => unit.building)
  units: Unit[];
}