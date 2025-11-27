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
  id: number;
  username: string;
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
  id: number;
  username: string;
  nickname: string;
  email: string;
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

