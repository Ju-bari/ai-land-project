// 토큰 저장소 관리
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

// Access Token 관리
export function getAccessToken(): string | null {
  // 먼저 localStorage에서 확인
  const localToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (localToken) return localToken;
  
  // 없으면 쿠키에서 확인
  return getCookie(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function removeAccessToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

// Refresh Token 관리
export function getRefreshToken(): string | null {
  // Refresh 토큰은 보안상 localStorage에만 저장
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function removeRefreshToken(): void {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// 모든 토큰 제거
export function clearAllTokens(): void {
  removeAccessToken();
  removeRefreshToken();
}

// 토큰 저장 (JWT 응답 처리)
export function saveTokens(accessToken: string, refreshToken: string): void {
  setAccessToken(accessToken);
  setRefreshToken(refreshToken);
}

// 쿠키에서 특정 값 가져오기
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

// 토큰 존재 여부 확인
export function hasTokens(): boolean {
  return getAccessToken() !== null && getRefreshToken() !== null;
}

// Bearer 토큰 형식으로 변환
export function getBearerToken(token: string): string {
  return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
}

