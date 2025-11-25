import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Home, UserCircle } from "lucide-react"

interface Feature {
    title: string
    description: string
    icon: React.ReactNode
}

export function Features() {
    const features: Feature[] = [
        {
            title: "캐릭터 생성",
            description: "무한한 커스터마이징 옵션으로 나만의 아바타를 디자인하세요.",
            icon: <UserCircle className="w-12 h-12 text-blue-400 mb-4" />,
        },
        {
            title: "마을 건설",
            description: "꿈꾸던 나만의 마을을 건설하고 실제 유저들을 초대하세요.",
            icon: <Home className="w-12 h-12 text-purple-400 mb-4" />,
        },
        {
            title: "커뮤니티",
            description: "친구들, 그리고 다른 주민들과 실시간으로 소통하세요.",
            icon: <Users className="w-12 h-12 text-pink-400 mb-4" />,
        },
    ]

    return (
        <section className="py-24 bg-slate-950 text-white">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">주요 기능</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto">
                        완벽한 나만의 공간을 만들기 위한 모든 것이 준비되어 있습니다.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <Card key={index} className="bg-slate-900/50 border-slate-800 hover:bg-slate-900 transition-colors duration-300">
                            <CardHeader className="text-center">
                                <div className="flex justify-center">{feature.icon}</div>
                                <CardTitle className="text-2xl text-white">{feature.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center">
                                <CardDescription className="text-slate-400 text-lg">
                                    {feature.description}
                                </CardDescription>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    )
}
