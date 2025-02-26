// src/til/til.service.simple-test.ts
import { TilService } from './til.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';

async function runTest() {
  console.log('TIL 서비스 테스트 시작...');
  
  // 완전한 AxiosResponse 형식으로 응답 객체 생성
  const createMockResponse = (data: any, url: string): AxiosResponse => ({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: { 
      url,
      headers: {} 
    } as any
  });
  
  // HTTP 서비스 모킹 (jest 없이 함수 모킹)
  const httpService = {
    post: (url: string, data: any, config?: any) => {
      console.log(`[Mock] HTTP 요청: ${url}`);
      console.log('요청 데이터:', data);
      
      if (url.includes('/summation')) {
        return of(createMockResponse({
          markdown: '# 변환된 마크다운\n\n내용...',
          summary: '요약',
          keywords: ['키워드1', '키워드2']
        }, url));
      } else {
        return of(createMockResponse({
          enhanced_content: '# 향상된 내용\n\n내용...',
          keywords: ['키워드1', '키워드2'],
          suggested_images: [{ url: 'https://example.com/image.png', description: '설명' }]
        }, url));
      }
    }
  } as HttpService;
  
  // 설정 서비스 모킹 (jest 없이 함수 모킹)
  const configService = {
    get: (key: string) => {
      if (key === 'LLM_API_URL') return 'http://test-llm-server:5000/api/v1';
      if (key === 'LLM_API_KEY') return 'test-api-key';
      return undefined;
    }
  } as ConfigService;
  
  // 서비스 인스턴스 생성
  const tilService = new TilService(httpService, configService);
  
  try {
    // 테스트 사용자
    const testUser = { id: 'test-user-id' };
    
    // Markdown 변환 테스트
    console.log('\n=== Markdown 변환 테스트 ===');
    const convertResult = await tilService.convertToMarkdown(
      testUser,
      { content: '테스트 내용입니다.' }
    );
    console.log('결과:', JSON.stringify(convertResult, null, 2));
    
    // TIL 향상 테스트
    console.log('\n=== TIL 향상 테스트 ===');
    const enhanceResult = await tilService.enhanceTil(
      testUser,
      { 
        content: '테스트 내용입니다.',
        language: 'ko',
        include_images: true
      }
    );
    console.log('결과:', JSON.stringify(enhanceResult, null, 2));
    
    console.log('\n테스트 완료!');
  } catch (error) {
    console.error('테스트 실패:', error);
  }
}

// 테스트 실행
runTest().catch(error => {
  console.error('테스트 중 오류 발생:', error);
});