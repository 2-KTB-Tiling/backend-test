// src/auth/github.strategy.ts
// 이 파일은 직접적인 GitHub 코드 교환에 사용하지 않고
// 프론트엔드에서 받은 코드를 처리하는 방식으로 진행할 예정이므로
// 전체 구현은 auth.service.ts에서 진행합니다.

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubStrategy {
  constructor(
    private configService: ConfigService,
  ) {}

  // GitHub API와 직접 통신하는 로직은 auth.service.ts에 구현
}