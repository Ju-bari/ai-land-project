import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { checkUserExist, signUpUser } from '../api/userApi';
import { UserSignUpRequest } from '../types/user.types';

export default function SignUp() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<UserSignUpRequest>({
    username: '',
    password: '',
    nickname: '',
    email: '',
  });

  const [confirmPassword, setConfirmPassword] = useState('');
  const [usernameChecked, setUsernameChecked] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // 입력값 변경 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // username이 변경되면 중복 확인 상태 초기화
    if (name === 'username') {
      setUsernameChecked(false);
      setUsernameAvailable(false);
    }
    
    // 에러 메시지 제거
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Username 중복 확인
  const handleCheckUsername = async () => {
    if (!formData.username) {
      setErrors(prev => ({ ...prev, username: '아이디를 입력해주세요.' }));
      return;
    }

    if (formData.username.length < 4) {
      setErrors(prev => ({ ...prev, username: '아이디는 4자 이상이어야 합니다.' }));
      return;
    }

    setIsLoading(true);
    try {
      const exists = await checkUserExist(formData.username);
      setUsernameChecked(true);
      
      if (exists) {
        setUsernameAvailable(false);
        setErrors(prev => ({ ...prev, username: '이미 사용 중인 아이디입니다.' }));
      } else {
        setUsernameAvailable(true);
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.username;
          return newErrors;
        });
      }
    } catch (error) {
      console.error('Username check failed:', error);
      setErrors(prev => ({ ...prev, username: '아이디 확인 중 오류가 발생했습니다.' }));
    } finally {
      setIsLoading(false);
    }
  };

  // 유효성 검사
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!usernameChecked || !usernameAvailable) {
      newErrors.username = '아이디 중복 확인이 필요합니다.';
    }

    if (!formData.password || formData.password.length < 4) {
      newErrors.password = '비밀번호는 4자 이상이어야 합니다.';
    }

    if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }

    if (!formData.nickname) {
      newErrors.nickname = '닉네임을 입력해주세요.';
    }

    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 회원가입 제출
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await signUpUser(formData);
      navigate('/login'); // 로그인 페이지로 이동
    } catch (error) {
      console.error('Sign up failed:', error);
      alert('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">회원가입</CardTitle>
          <CardDescription className="text-center">
            AI Land에 가입하고 모험을 시작하세요!
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">아이디</Label>
              <div className="flex gap-2">
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="4자 이상 입력"
                  value={formData.username}
                  onChange={handleChange}
                  className={errors.username ? 'border-red-500' : usernameAvailable ? 'border-green-500' : ''}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  onClick={handleCheckUsername}
                  disabled={isLoading || !formData.username}
                  variant="outline"
                  className="whitespace-nowrap"
                >
                  중복 확인
                </Button>
              </div>
              {errors.username && (
                <p className="text-sm text-red-500">{errors.username}</p>
              )}
              {usernameAvailable && (
                <p className="text-sm text-green-500">사용 가능한 아이디입니다.</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="4자 이상 입력"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">비밀번호 확인</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="비밀번호 재입력"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.confirmPassword;
                      return newErrors;
                    });
                  }
                }}
                className={errors.confirmPassword ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Nickname */}
            <div className="space-y-2">
              <Label htmlFor="nickname">닉네임</Label>
              <Input
                id="nickname"
                name="nickname"
                type="text"
                placeholder="닉네임 입력"
                value={formData.nickname}
                onChange={handleChange}
                className={errors.nickname ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.nickname && (
                <p className="text-sm text-red-500">{errors.nickname}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="example@email.com"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? '처리 중...' : '회원가입'}
            </Button>
            
            <div className="text-center text-sm">
              <span className="text-gray-600">이미 계정이 있으신가요? </span>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-blue-600 hover:underline font-medium"
                disabled={isLoading}
              >
                로그인
              </button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

