import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserAuth } from '../hooks/useUserAuth';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * 인증이 필요한 페이지를 보호하는 컴포넌트
 * 
 * 동작 방식:
 * 1. useUserAuth 훅을 통해 현재 사용자의 인증 상태를 확인
 * 2. isAuthenticated가 true면 자식 컴포넌트(보호된 페이지)를 렌더링
 * 3. isAuthenticated가 false면 /login 페이지로 리다이렉트
 * 
 * 사용 예시:
 * <Route path="/lands" element={<ProtectedRoute><Lands /></ProtectedRoute>} />
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useUserAuth();

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 인증된 경우 자식 컴포넌트 렌더링
  return <>{children}</>;
}

