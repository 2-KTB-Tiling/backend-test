// src/common/utils/date-path.utils.ts

/**
 * 날짜를 기반으로 경로와 파일명을 생성하는 유틸리티 함수들
 */

/**
 * 월 번호(0-11)를 영문 약자로 변환 (앞 3글자)
 * @param monthIndex 월 인덱스 (0-11)
 * @returns 월의 영문 약자 (Jan, Feb, Mar, ...)
 */
export function getMonthShortName(monthIndex: number): string {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    // 유효한 월 인덱스 확인 (0-11)
    if (monthIndex < 0 || monthIndex > 11) {
      throw new Error(`유효하지 않은 월 인덱스: ${monthIndex}`);
    }
    
    return months[monthIndex];
  }
  
  /**
   * 날짜에 따른 경로 구조 생성
   * 예: 2025/Oct/ 형식의 경로 반환
   * @param date 날짜 객체
   * @returns 연도/월/ 형식의 경로
   */
  export function createDateBasedPath(date: Date = new Date()): string {
    const year = date.getFullYear();
    const monthIndex = date.getMonth();
    const monthShort = getMonthShortName(monthIndex);
    
    // 끝에 슬래시를 포함하거나 포함하지 않도록 일관성 있게 유지
    // 방법 1: 슬래시 포함 (createFullDateBasedPath에서 처리)
    return `${year}/${monthShort}/`;
    
    // 또는 방법 2: 슬래시 미포함
    // return `${year}/${monthShort}`;
  }
  
  /**
   * 날짜에 따른 파일명 생성
   * 예: 2025-10-25.md 형식의 파일명 반환
   * @param date 날짜 객체
   * @returns yyyy-MM-dd.md 형식의 파일명
   */
  export function createDateBasedFilename(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 01-12
    const day = String(date.getDate()).padStart(2, '0'); // 01-31
    
    return `${year}-${month}-${day}.md`;
  }
  
  /**
   * 현재 날짜를 기준으로 전체 파일 경로 생성
   * 예: 2025/Oct/2025-10-25.md 형식의 경로 반환
   * @param date 날짜 객체 (기본값: 현재 날짜)
   * @returns 전체 파일 경로
   */
  export function createFullDateBasedPath(date: Date = new Date()): string {
    const path = createDateBasedPath(date);
    const filename = createDateBasedFilename(date);
    
    // 경로 끝의 슬래시를 확인하고, 중복 슬래시 방지
    if (path.endsWith('/')) {
      return `${path}${filename}`;
    } else {
      return `${path}/${filename}`;
    }
  }