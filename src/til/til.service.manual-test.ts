// src/til/til.service.manual-test.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TilService } from './til.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const tilService = app.get(TilService);
  
  try {
    // 테스트용 사용자 객체
    const testUser = { id: 'test-user-id' };
    
    // 테스트 케이스 1: 정상 케이스 (현재는 서버가 없어서 실패함)
    console.log("\n=== 테스트 케이스 1: 정상 요청 ===");
    try {
      const convertResult = await tilService.convertToMarkdown(
        testUser,
        { content: '오늘은 NestJS를 공부했습니다. REST API를 구현하는 방법을 배웠습니다.' }
      );
      console.log('결과:', convertResult);
    } catch (error) {
      console.error('예상된 오류 (서버 없음):', error.message);
    }
    
    // 테스트 케이스 2: 필수 파라미터 누락 (content가 없음)
    console.log("\n=== 테스트 케이스 2: 필수 파라미터 누락 ===");
    try {
      // @ts-ignore - 의도적으로 타입 에러 무시
      const invalidResult = await tilService.convertToMarkdown(
        testUser,
        { content: '' } // 빈 content
      );
      console.log('결과:', invalidResult);
    } catch (error) {
      console.error('유효성 검사 오류:', error.message);
    }
    
    // 테스트 케이스 3: 잘못된 언어 코드
    console.log("\n=== 테스트 케이스 3: 잘못된 언어 코드 ===");
    try {
      // @ts-ignore - 의도적으로 타입 에러 무시
      const invalidLangResult = await tilService.enhanceTil(
        testUser,
        { 
          content: '오늘은 NestJS를 공부했습니다.',
          language: 'fr', // ko나 en이 아님
          include_images: true
        }
      );
      console.log('결과:', invalidLangResult);
    } catch (error) {
      console.error('언어 코드 오류:', error.message);
    }
    
  } catch (error) {
    console.error('전체 테스트 실패:', error);
  } finally {
    await app.close();
  }
}

bootstrap();