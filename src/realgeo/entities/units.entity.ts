import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Building } from './buildings.entity';

@Entity('units')
export class Unit {
  @PrimaryColumn({ name: 'unit_id' })
  unitId: number;

  @Column({ name: 'unit_year_built', nullable: true })
  unitYearBuilt: number;

  @Column({ name: 'unit_covered_extent', nullable: true })
  unitCoveredExtent: number;

  @Column({ name: 'unit_parking_place_number', nullable: true })
  unitParkingPlaceNumber: number;

  @Column({ name: 'unit_property_type_nameen', nullable: true })
  unitPropertyTypeNameen: string;

  @Column({ name: 'unit_property_type_namegr', nullable: true })
  unitPropertyTypeNamegr: string;

  @Column({ name: 'unit_uncovered_extent', nullable: true })
  unitUncoveredExtent: number;

  @Column({ name: 'unit_floor_number', nullable: true })
  unitFloorNumber: number;

  @Column({ name: 'unit_refurbish_year', nullable: true })
  unitRefurbishYear: number;

  @Column({ name: 'unit_refurbish_type', nullable: true })
  unitRefurbishType: number;

  @Column({ name: 'unit_disability', nullable: true })
  unitDisability: number;

  @Column({ name: 'unit_parking_place_code', nullable: true })
  unitParkingPlaceCode: number;

  @Column({ name: 'unit_frame_type', nullable: true })
  unitFrameType: number;

  @Column({ name: 'unit_view_code', nullable: true })
  unitViewCode: number;

  @Column({ name: 'unit_condition_code', nullable: true })
  unitConditionCode: number;

  @Column({ name: 'unit_outbounding_extent', nullable: true })
  unitOutboundingExtent: string;

  @Column({ name: 'unit_flat_no', nullable: true })
  unitFlatNo: string;

  @Column({ name: 'unit_total_floor_no', nullable: true })
  unitTotalFloorNo: number;

  @Column({ name: 'building_id', nullable: true })
  buildingId: number;

  @Column({ name: 'registration_number', nullable: true })
  registrationNumber: number;

  @Column({ name: 'registration_block', nullable: true })
  registrationBlock: number;

  @Column({ name: 'unit_refurbish_type_dsc', nullable: true })
  unitRefurbishTypeDsc: string;

  @Column({ name: 'unit_disability_dsc', nullable: true })
  unitDisabilityDsc: string;

  @Column({ name: 'unit_parking_place_code_dsc', nullable: true })
  unitParkingPlaceCodeDsc: string;

  @Column({ name: 'unit_frame_type_dsc', nullable: true })
  unitFrameTypeDsc: string;

  @Column({ name: 'unit_view_code_dsc', nullable: true })
  unitViewCodeDsc: string;

  @Column({ name: 'unit_condition_code_dsc', nullable: true })
  unitConditionCodeDsc: string;

  @Column({ name: 'unit_enclosed_extent', nullable: true })
  unitEnclosedExtent: number;

  @Column({ name: 'unit_bedroom_number', nullable: true })
  unitBedroomNumber: number;

  @Column({ name: 'unit_class', nullable: true })
  unitClass: string;

  @Column({ name: 'unit_subproperties', nullable: true })
  unitSubproperties: string;

  @Column({ name: 'unit_basement_extent', nullable: true })
  unitBasementExtent: number;

  @Column({ name: 'unit_outbuilding_extent', nullable: true })
  unitOutbuildingExtent: number;

  @Column({ name: 'unit_ancillary_extent', nullable: true })
  unitAncillaryExtent: number;

  @Column({ name: 'unit_pool_extent', nullable: true })
  unitPoolExtent: number;

  @Column({ name: 'unit_garden_extent', nullable: true })
  unitGardenExtent: string;

  @Column({ name: 'unit_tourist_class_code', nullable: true })
  unitTouristClassCode: string;

  @Column({ name: 'unit_ground_floor_extent', nullable: true })
  unitGroundFloorExtent: string;

  @Column({ name: 'unit_mezzanine_extent', nullable: true })
  unitMezzanineExtent: number;

  @Column({ name: 'unit_first_floor_extent', nullable: true })
  unitFirstFloorExtent: string;

  @Column({ name: 'unit_other_floor_extent', nullable: true })
  unitOtherFloorExtent: string;

  @Column({ name: 'unit_access_relation_code', nullable: true })
  unitAccessRelationCode: string;

  @Column({ name: 'unit_outer_shop_code', nullable: true })
  unitOuterShopCode: string;

  @Column({ name: 'unit_eaves_height_msr', nullable: true })
  unitEavesHeightMsr: string;

  @Column({ name: 'unit_storey_height_msr', nullable: true })
  unitStoreyHeightMsr: string;

  @Column({ name: 'unit_semi_basement_extent', nullable: true })
  unitSemiBasementExtent: number;

  @Column({ name: 'pr_2013', nullable: true })
  pr2013: number;

  @Column({ name: 'pr_2018', nullable: true })
  pr2018: number;

  @Column({ name: 'pr_2021', nullable: true })
  pr2021: number;

  @Column({ name: 'plan_no', nullable: true })
  planNo: string;

  @Column({ name: 'unit_actual_use', nullable: true })
  unitActualUse: string;

  @Column({ name: 'unit_tourist_class_code_dsc', nullable: true })
  unitTouristClassCodeDsc: string;

  @Column({ name: 'unit_outer_shop_code_dsc', nullable: true })
  unitOuterShopCodeDsc: string;

  @Column({ name: 'unit_subproperty_type_gr', nullable: true })
  unitSubpropertyTypeGr: string;

  @Column({ name: 'unit_subproperty_type_en', nullable: true })
  unitSubpropertyTypeEn: string;

  @Column({ name: 'unit_subproperty_type_category', nullable: true })
  unitSubpropertyTypeCategory: string;

  @Column({ name: 'prpropertysubpropertyid', nullable: true })
  prpropertysubpropertyid: number;

  @Column({ name: 'unit_property_id', nullable: true })
  unitPropertyId: number;

  @Column({ name: 'unit_is_legal', nullable: true })
  unitIsLegal: string;

  @Column({ name: 'unit_is_depressed', nullable: true })
  unitIsDepressed: string;

  @Column({ name: 'unit_occupation_status', nullable: true })
  unitOccupationStatus: string;

  @Column({ name: 'pr_unit_covered_extent', nullable: true })
  prUnitCoveredExtent: number;

  @Column({ name: 'pr_unit_uncovered_extent', nullable: true })
  prUnitUncoveredExtent: number;

  @Column({ name: 'pr_unit_enclosed_extent', nullable: true })
  prUnitEnclosedExtent: number;

  @ManyToOne(() => Building, (building) => building.units)
  @JoinColumn({ name: 'building_id' })
  building: Building;
}