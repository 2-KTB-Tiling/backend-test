// src/til/til.controller.ts
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { TilService } from './til.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ConvertTilDto } from './dto/convert-til.dto';
import { EnhanceTilDto } from './dto/enhance-til.dto';

@Controller('til')
export class TilController {
  constructor(private readonly tilService: TilService) {}

  @Post('convert')
  @UseGuards(JwtAuthGuard)
  async convertToMarkdown(@Request() req, @Body() convertTilDto: ConvertTilDto) {
    return this.tilService.convertToMarkdown(req.user, convertTilDto);
  }

  @Post('enhance')
  @UseGuards(JwtAuthGuard)
  async enhanceTil(@Request() req, @Body() enhanceTilDto: EnhanceTilDto) {
    return this.tilService.enhanceTil(req.user, enhanceTilDto);
  }
}