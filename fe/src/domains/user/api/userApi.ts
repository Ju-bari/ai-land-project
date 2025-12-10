import {
  UserExistRequest,
  UserSignUpRequest,
  UserInfoResponse,
  CommonResponse,
  JwtResponse,
  RefreshRequest,
  LoginRequest,
} from '../types/user.types';
import {
  getAccessToken,
  getRefreshToken,
  saveTokens,
  clearAllTokens,
} from '../utils/tokenManager';

const BASE_URL = import.meta.env.VITE_BACKEND_SPRING_BASE_URL || 'http://localhost:8080';
const API_PREFIX = '/api/v1';

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// 토큰 갱신 대기 중인 요청들을 처리
function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach(callback => callback(newToken));
  refreshSubscribers = [];
}

// JWT Refresh API
export async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(`${BASE_URL}${API_PREFIX}/jwt/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken } as RefreshRequest),
    credentials: 'include',
  });

  if (!response.ok) {
    clearAllTokens();
    throw new Error('Failed to refresh token');
  }

  const jwtResponse: JwtResponse = await response.json();
  saveTokens(jwtResponse.accessToken, jwtResponse.refreshToken);

  return jwtResponse.accessToken;
}

// API 요청 옵션
interface ApiRequestOptions extends RequestInit {
  requireAuth?: boolean; // 인증이 필요한 요청인지 여부 (기본: true)
}

// API 요청 헬퍼 함수 (자동 토큰 갱신 포함)
async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
  retry = true
): Promise<CommonResponse<T>> {
  const { requireAuth = true, ...fetchOptions } = options;
  const token = getAccessToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...fetchOptions.headers,
  };

  const response = await fetch(`${BASE_URL}${API_PREFIX}${endpoint}`, {
    ...fetchOptions,
    headers,
    credentials: 'include', // 쿠키 포함
  });

  // 401 에러 (Unauthorized) - 토큰 만료
  // 인증이 필요한 요청에서만 자동 갱신 시도
  if (response.status === 401 && retry && requireAuth) {
    if (!isRefreshing) {
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        isRefreshing = false;
        onTokenRefreshed(newToken);

        // 새 토큰으로 재시도
        return apiRequest<T>(endpoint, options, false);
      } catch (error) {
        isRefreshing = false;
        refreshSubscribers = [];
        clearAllTokens();

        // 로그인 페이지로 리다이렉트
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }
    } else {
      // 이미 토큰 갱신 중이면 대기
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((_token: string) => {
          // 새 토큰으로 재시도
          apiRequest<T>(endpoint, options, false)
            .then(resolve)
            .catch(reject);
        });
      });
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      successOrNot: 'N',
      statusCode: 'ERROR',
      data: null,
    }));
    throw new Error(errorData.statusCode || 'API request failed');
  }

  return response.json();
}

// ============ JWT 관련 API ============

// 쿠키 방식의 Refresh 토큰을 헤더 방식으로 교환 (소셜 로그인용)
export async function exchangeJwtToken(): Promise<JwtResponse> {
  const response = await fetch(`${BASE_URL}${API_PREFIX}/jwt/exchange`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to exchange JWT token');
  }

  const jwtResponse: JwtResponse = await response.json();
  saveTokens(jwtResponse.accessToken, jwtResponse.refreshToken);

  return jwtResponse;
}

// Refresh 토큰으로 Access 토큰 재발급
export async function refreshToken(): Promise<JwtResponse> {
  return await refreshAccessToken() as unknown as JwtResponse;
}

// ============ 사용자 인증 API ============

// 로그인 API (Spring Security 자체 로그인)
// 참고: Spring Security는 기본적으로 /login 엔드포인트를 사용하지만
// 커스텀 엔드포인트가 있다면 해당 엔드포인트를 사용해야 합니다.
export async function loginUser(data: LoginRequest): Promise<JwtResponse> {
  try {
    const response = await fetch(`${BASE_URL}${API_PREFIX}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    if (!response.ok) {
      // 상태 코드별 에러 처리
      if (response.status === 401) {
        throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
      } else if (response.status === 500) {
        throw new Error('서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      } else if (response.status === 403) {
        throw new Error('계정이 잠겨있거나 접근이 거부되었습니다.');
      }

      const errorData = await response.json().catch(() => ({
        message: '로그인에 실패했습니다.',
      }));
      throw new Error(errorData.message || '로그인에 실패했습니다.');
    }

    const jwtResponse: JwtResponse = await response.json();

    // JWT 토큰 검증
    if (!jwtResponse.accessToken || !jwtResponse.refreshToken) {
      throw new Error('서버에서 유효한 토큰을 받지 못했습니다.');
    }

    saveTokens(jwtResponse.accessToken, jwtResponse.refreshToken);

    return jwtResponse;
  } catch (error) {
    // 네트워크 에러 등
    if (error instanceof TypeError) {
      throw new Error('서버에 연결할 수 없습니다. 네트워크를 확인해주세요.');
    }
    throw error;
  }
}

// 로그아웃 API
export async function logoutUser(): Promise<void> {
  try {
    // 백엔드 로그아웃 API 호출
    await apiRequest<void>('/users/logout', {
      method: 'POST',
    });
  } catch {
    // 로그아웃 API 실패는 무시 (이미 로그아웃 상태이거나 토큰이 만료된 경우)
  } finally {
    // API 실패 여부와 관계없이 로컬 토큰 제거
    clearAllTokens();
  }
}

// ============ 사용자 관리 API ============

// 유저 존재 확인 API (인증 불필요)
export async function checkUserExist(username: string): Promise<boolean> {
  const requestData: UserExistRequest = { username };
  const response = await apiRequest<boolean>('/users/exist', {
    method: 'POST',
    body: JSON.stringify(requestData),
    requireAuth: false, // 인증 불필요
  });
  return response.data;
}

// 회원가입 API (인증 불필요)
export async function signUpUser(data: UserSignUpRequest): Promise<number> {
  const response = await apiRequest<number>('/users', {
    method: 'POST',
    body: JSON.stringify(data),
    requireAuth: false, // 인증 불필요
  });
  return response.data;
}

// 유저 정보 조회 API
export async function getUserInfo(): Promise<UserInfoResponse> {
  const response = await apiRequest<UserInfoResponse>('/users', {
    method: 'GET',
  });

  if (!response.data) {
    throw new Error('Invalid user info response: no data');
  }

  if (!response.data.userId) {
    throw new Error('Invalid user info response: missing userId');
  }

  return response.data;
}

// 유저 정보 수정 API
export async function updateUserInfo(data: Partial<UserSignUpRequest>): Promise<number> {
  const response = await apiRequest<number>('/users', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.data;
}

// 유저 삭제 API
export async function deleteUser(username: string): Promise<void> {
  const response = await apiRequest<void>('/users', {
    method: 'DELETE',
    body: JSON.stringify({ username }),
  });
  return response.data;
}

