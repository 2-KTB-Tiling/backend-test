import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { TilController } from './til.controller';
import { TilService } from './til.service';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
  ],
  controllers: [TilController],
  providers: [TilService],
  exports: [TilService],
})
export class TilModule {}