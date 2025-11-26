import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider } from "@/hooks/useAuth"
import { Home } from "./domains/home/components"
import { Lands } from "./domains/land/components/Lands"
import { LandDetail } from "./domains/land/components/LandDetail"

function App() {
  return (
    <AuthProvider>
      <Router>
        <main className="min-h-screen bg-slate-950">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/lands" element={<Lands />} />
            <Route path="/lands/:id" element={<LandDetail />} />
          </Routes>
        </main>
      </Router>
    </AuthProvider>
  )
}

export default App
