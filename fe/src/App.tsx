import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { UserAuthProvider, SignUp, Login, ProtectedRoute } from "./domains/user"
import { Home } from "./domains/home/components"
import { Lands } from "./domains/land/components/Lands"
import { LandDetail } from "./domains/land/components/LandDetail"

function App() {
  return (
    <UserAuthProvider>
      <Router>
        <main className="min-h-screen bg-slate-950">
          <Routes>
            {/* 공개 페이지 - 로그인 없이 접근 가능 */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            
            {/* 보호된 페이지 - 로그인 필요 */}
            <Route path="/lands" element={<ProtectedRoute><Lands /></ProtectedRoute>} />
            <Route path="/lands/:id" element={<ProtectedRoute><LandDetail /></ProtectedRoute>} />
          </Routes>
        </main>
      </Router>
    </UserAuthProvider>
  )
}

export default App
