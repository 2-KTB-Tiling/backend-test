// src/github/github.module.ts
import { Module } from '@nestjs/common';
import { GithubController } from './github.controller';
import { GithubService } from './github.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule], // AuthService 의존성을 위해 AuthModule 가져오기
  controllers: [GithubController],
  providers: [GithubService],
  exports: [GithubService], // 다른 모듈에서 GithubService를 사용할 수 있도록 내보내기
})
export class GithubModule {}