import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RealgeoService } from './realgeo.service';
import { CreateRealgeoDto } from './dto/create-realgeo.dto';
import { UpdateRealgeoDto } from './dto/update-realgeo.dto';

@Controller('realgeo')
export class RealgeoController {
  constructor(private readonly realgeoService: RealgeoService) {}

  @Post()
  create(@Body() createRealgeoDto: CreateRealgeoDto) {
    return this.realgeoService.create(createRealgeoDto);
  }

  @Get()
  findAll() {
    return this.realgeoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.realgeoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRealgeoDto: UpdateRealgeoDto) {
    return this.realgeoService.update(+id, updateRealgeoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.realgeoService.remove(+id);
  }
}
