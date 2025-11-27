import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"

export function Hero() {
    const navigate = useNavigate()

    return (
        <section className="relative h-screen flex items-center justify-center overflow-hidden bg-slate-950 text-white">
            {/* Background effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0a] to-black opacity-80"></div>
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
            </div>

            <div className="relative z-10 container mx-auto px-4 text-center">
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    AI Land
                </h1>
                <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                    나만의 마을을 만들고, 친구들을 초대하여 우리만의 공간을 꾸며보세요.
                    당신의 새로운 이야기가 여기서 시작됩니다.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-400">
                    <Button
                        size="lg"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-full shadow-lg shadow-blue-900/20 transition-all hover:scale-105"
                        onClick={() => navigate('/lands')}
                    >
                        랜드 찾아보기
                    </Button>
                </div>
            </div>
        </section>
    )
}
