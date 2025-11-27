import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useUserAuth } from "@/domains/user";

export function Header() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useUserAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 hover:from-blue-300 hover:to-purple-400 transition-all"
          >
            AI Land
          </button>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* 로그인된 상태 */}
                <span className="text-slate-300 text-sm mr-2">
                  안녕하세요, <span className="font-semibold text-white">{user?.nickname || user?.username}</span>님
                </span>
                <Button
                  variant="outline"
                  onClick={() => navigate("/lands")}
                  className="bg-transparent border-slate-700 text-white hover:bg-slate-800 hover:text-white"
                >
                  랜드 보기
                </Button>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="bg-transparent border-slate-700 text-slate-300 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all"
                >
                  로그아웃
                </Button>
              </>
            ) : (
              <>
                {/* 로그인되지 않은 상태 */}
                <Button
                  variant="outline"
                  onClick={() => navigate("/login")}
                  className="bg-transparent border-slate-700 text-white hover:bg-slate-800 hover:text-white"
                >
                  로그인
                </Button>
                <Button
                  onClick={() => navigate("/signup")}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20"
                >
                  회원가입
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

