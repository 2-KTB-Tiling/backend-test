// src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // JWT 페이로드에서 사용자 정보 추출
    const user = {
      id: payload.sub,
      sub: payload.sub,
      github_id: payload.github_id,
      email: payload.email,
    };
    
    if (!user) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
    
    return user;
  }
}