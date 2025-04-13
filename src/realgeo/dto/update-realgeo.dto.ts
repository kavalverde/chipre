import { PartialType } from '@nestjs/mapped-types';
import { CreateRealgeoDto } from './create-realgeo.dto';

export class UpdateRealgeoDto extends PartialType(CreateRealgeoDto) {}
