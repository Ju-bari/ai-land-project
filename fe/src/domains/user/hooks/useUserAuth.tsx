import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType, UserSignUpRequest } from '../types/user.types';
import { 
  getUserInfo, 
  signUpUser, 
  checkUserExist, 
  loginUser,
  logoutUser,
} from '../api/userApi';
import { hasTokens, clearAllTokens } from '../utils/tokenManager';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function UserAuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 초기 로드 시 사용자 정보 확인
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // 토큰이 있는지 확인
      if (hasTokens()) {
        const userInfo = await getUserInfo();
        setUser(userInfo);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      setUser(null);
      setIsAuthenticated(false);
      // 토큰이 유효하지 않으면 제거
      clearAllTokens();
    } finally {
      setIsLoading(false);
    }
  };

  // 로그인
  const login = async (username: string, password: string) => {
    try {
      await loginUser({ username, password });
      // 로그인 성공 시 사용자 정보 가져오기
      await checkAuthStatus();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // 로그아웃
  const logout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      // 로그아웃 에러는 무시 (토큰은 이미 제거됨)
      console.log('Logout error (ignored):', error);
    } finally {
      // 항상 로컬 상태 초기화
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // 회원가입
  const signUp = async (data: UserSignUpRequest) => {
    try {
      await signUpUser(data);
      // 회원가입 후 자동 로그인은 하지 않음
      // 사용자가 로그인 페이지에서 직접 로그인하도록 함
    } catch (error) {
      console.error('Sign up failed:', error);
      throw error;
    }
  };

  // 아이디 중복 확인
  const checkUsername = async (username: string): Promise<boolean> => {
    try {
      return await checkUserExist(username);
    } catch (error) {
      console.error('Username check failed:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    login,
    logout,
    signUp,
    checkUsername,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useUserAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useUserAuth must be used within a UserAuthProvider');
  }
  return context;
}

