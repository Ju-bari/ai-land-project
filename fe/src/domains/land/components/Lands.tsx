import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, ArrowRight } from "lucide-react"
import { Header } from "@/domains/home/components/Header"

import { dummyLands } from "@/domains/land/constants/dummyLands"

export function Lands() {
    const navigate = useNavigate()

    return (
        <>
            <Header />
            <div className="min-h-screen bg-slate-950 text-white pt-20 p-8">
                <div className="container mx-auto">
                    <div className="flex justify-between items-center mb-12">
                        <div>
                            <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                                랜드 목록
                            </h1>
                            <p className="text-slate-400">자신에게 맞는 랜드를 찾아보세요.</p>
                        </div>
                        <Button variant="outline" className="bg-white text-black hover:bg-slate-200 border-transparent" onClick={() => navigate('/')}>
                            홈으로 돌아가기
                        </Button>
                    </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {dummyLands.map((land) => (
                        <Card
                            key={land.id}
                            className="bg-slate-900/50 border-slate-800 overflow-hidden hover:border-slate-700 transition-all duration-300 group cursor-pointer"
                            onClick={() => navigate(`/lands/${land.id}`)}
                        >
                            <div className="h-48 overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent z-10 opacity-60"></div>
                                <img
                                    src={land.image}
                                    alt={land.name}
                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                />
                            </div>
                            <CardHeader>
                                <CardTitle className="text-xl text-white flex justify-between items-center">
                                    {land.name}
                                </CardTitle>
                                <CardDescription className="text-slate-400">
                                    {land.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center text-slate-500 text-sm">
                                        <Users className="w-4 h-4 mr-2" />
                                        {land.population.toLocaleString()}명 거주 중
                                    </div>
                                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                                        참여하기 <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                </div>
            </div>
        </>
    )
}

