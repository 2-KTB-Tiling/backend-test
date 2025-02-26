import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // 테스트 환경에서는 항상 인증 통과
    const request = context.switchToHttp().getRequest();
    request.user = { id: 'test-user-id' };
    return true;
  }
}