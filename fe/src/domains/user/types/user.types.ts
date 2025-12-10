// API 요청 타입
export interface UserExistRequest {
  username: string;
}

export interface UserSignUpRequest {
  username: string;
  password: string;
  nickname: string;
  email: string;
}

export interface UserInfoResponse {
  userId: number;  // 백엔드에서 userId로 변경됨
  username: string;
  social: boolean;  // 소셜 로그인 여부
  nickname: string;
  email: string;
}

// JWT 관련 타입
export interface JwtResponse {
  grantType: string;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

// API 공통 응답 타입
export interface CommonResponse<T> {
  successOrNot: 'Y' | 'N';
  statusCode: string;
  data: T;
}

// 사용자 타입
export interface User {
  id: number;  // 내부적으로는 id로 사용 (UserInfoResponse의 userId를 매핑)
  username: string;
  nickname: string;
  email: string;
  social?: boolean;  // 소셜 로그인 여부 (선택적)
}

// 인증 컨텍스트 타입
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signUp: (data: UserSignUpRequest) => Promise<void>;
  checkUsername: (username: string) => Promise<boolean>;
}

