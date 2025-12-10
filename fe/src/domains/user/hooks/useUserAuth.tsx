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
      if (hasTokens()) {
        const userInfo = await getUserInfo();

        if (!userInfo.userId) {
          throw new Error('Invalid user info: missing userId');
        }

        const user: User = {
          id: userInfo.userId,
          username: userInfo.username,
          nickname: userInfo.nickname,
          email: userInfo.email,
          social: userInfo.social,
        };

        setUser(user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      setUser(null);
      setIsAuthenticated(false);
      clearAllTokens();
    } finally {
      setIsLoading(false);
    }
  };

  // 로그인
  const login = async (username: string, password: string) => {
    try {
      await loginUser({ username, password });
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
    } catch {
      // 로그아웃 에러는 무시 (토큰은 이미 제거됨)
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // 회원가입
  const signUp = async (data: UserSignUpRequest) => {
    try {
      await signUpUser(data);
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
