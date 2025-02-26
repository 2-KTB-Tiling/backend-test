// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 전역 설정: 유효성 검사 파이프
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 데코레이터가 없는 속성은 제거
      forbidNonWhitelisted: true, // 화이트리스트에 없는 속성이 있으면 요청 거부
      transform: true, // 타입 변환 활성화
    }),
  );
  
  // CORS 설정
  app.enableCors({
    origin: true, // 프론트엔드 URL 또는 특정 도메인 지정
    credentials: true,
  });
  
  // API 접두사 설정
  // app.setGlobalPrefix('api');
  
  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 3000;
  
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();