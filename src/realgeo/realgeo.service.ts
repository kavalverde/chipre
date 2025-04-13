import { Injectable } from '@nestjs/common';
import { CreateRealgeoDto } from './dto/create-realgeo.dto';
import { UpdateRealgeoDto } from './dto/update-realgeo.dto';

@Injectable()
export class RealgeoService {
  create(createRealgeoDto: CreateRealgeoDto) {
    return 'This action adds a new realgeo';
  }

  findAll() {
    return `This action returns all realgeo`;
  }

  findOne(id: number) {
    return `This action returns a #${id} realgeo`;
  }

  update(id: number, updateRealgeoDto: UpdateRealgeoDto) {
    return `This action updates a #${id} realgeo`;
  }

  remove(id: number) {
    return `This action removes a #${id} realgeo`;
  }
}
