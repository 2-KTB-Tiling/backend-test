// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
// 다른 모듈들은 추후 구현 후 추가
import { TilModule } from './til/til.module';
import { GithubModule } from './github/github.module';
// import { NotionModule } from './notion/notion.module';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    GithubModule,
    TilModule,

    // NotionModule,
  ],
  controllers: [AppController], // 이 부분 추가
})
export class AppModule {}