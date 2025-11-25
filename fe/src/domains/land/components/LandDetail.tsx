import { useParams, useNavigate } from "react-router-dom"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Thermometer, Mountain, Hammer, Mail, Calendar, Award, X, Users, ChevronLeft, ChevronRight, LogOut } from "lucide-react"
import { dummyLands } from "@/domains/land/constants/dummyLands"
import { dummyUsers, type User } from "@/domains/land/constants/dummyUsers"
import { dummyMapInfo } from "@/domains/land/constants/dummyMapInfo"

type RightPanelType = 'mapInfo' | 'userDetail'

export function LandDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const land = dummyLands.find(l => l.id === Number(id))
    
    const [rightPanelType, setRightPanelType] = useState<RightPanelType>('mapInfo')
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true)

    if (!land) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">랜드를 찾을 수 없습니다.</h1>
                    <Button onClick={() => navigate('/lands')} variant="outline">
                        목록으로 돌아가기
                    </Button>
                </div>
            </div>
        )
    }

    const onlineUsers = dummyUsers.filter(user => user.isOnline)
    const offlineUsers = dummyUsers.filter(user => !user.isOnline)

    function handleUserClick(user: User) {
        setSelectedUser(user)
        setRightPanelType('userDetail')
    }

    function handleBackToMapInfo() {
        setRightPanelType('mapInfo')
        setSelectedUser(null)
    }

    return (
        <div className="fixed inset-0 bg-slate-950 text-white overflow-hidden">
            {/* 전체 화면 레이아웃 */}
            <div className="relative h-full w-full">
                
                {/* 가운데: 전체 화면 맵 배경 */}
                <div className="absolute inset-0 z-0">
                    <img 
                        src={land.image}
                        alt="Map"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"></div>
                </div>

                {/* 왼쪽 패널 토글 버튼 (패널 닫혔을 때) */}
                {!isLeftPanelOpen && (
                    <Button
                        size="icon"
                        className="absolute top-8 left-4 z-30 h-10 w-10 bg-slate-900/95 text-slate-400 border border-slate-700 hover:bg-slate-800 hover:border-blue-500 hover:text-blue-400 backdrop-blur-md transition-all"
                        onClick={() => setIsLeftPanelOpen(true)}
                    >
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                )}

                {/* 왼쪽: 접속 유저 목록 */}
                <div className={`absolute left-0 top-0 bottom-0 w-80 p-4 overflow-y-auto transition-transform duration-300 ${isLeftPanelOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <Card className="bg-slate-900/95 border-slate-800 backdrop-blur-md h-full flex flex-col relative">
                        {/* 패널 내부 닫기 버튼 */}
                        <Button
                            size="icon"
                            className="absolute top-4 right-4 z-10 h-10 w-10 bg-slate-800/80 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:border-blue-500 hover:text-blue-400 transition-all"
                            onClick={() => setIsLeftPanelOpen(false)}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        
                        <CardHeader className="flex-shrink-0">
                            <CardTitle className="text-white text-xl mb-2 pr-14">
                                {land.name}
                            </CardTitle>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400 flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    접속 유저
                                </span>
                                <span className="text-slate-400">
                                    {onlineUsers.length}/{dummyUsers.length}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-4 overflow-y-auto">
                                {/* 온라인 유저 */}
                                <div>
                                    <h4 className="text-xs font-semibold text-green-400 mb-2 uppercase">
                                        온라인 ({onlineUsers.length})
                                    </h4>
                                    <div className="space-y-2">
                                        {onlineUsers.map((user) => (
                                            <div 
                                                key={user.id} 
                                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer"
                                                onClick={() => handleUserClick(user)}
                                            >
                                                <div className="relative">
                                                    <img 
                                                        src={user.avatar} 
                                                        alt={user.name}
                                                        className="w-10 h-10 rounded-full"
                                                    />
                                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                                                    <p className="text-xs text-green-400">온라인</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 오프라인 유저 */}
                                <div>
                                    <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase">
                                        오프라인 ({offlineUsers.length})
                                    </h4>
                                    <div className="space-y-2">
                                        {offlineUsers.map((user) => (
                                            <div 
                                                key={user.id} 
                                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors opacity-60 cursor-pointer"
                                                onClick={() => handleUserClick(user)}
                                            >
                                                <div className="relative">
                                                    <img 
                                                        src={user.avatar} 
                                                        alt={user.name}
                                                        className="w-10 h-10 rounded-full grayscale"
                                                    />
                                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-slate-600 border-2 border-slate-900 rounded-full"></span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-300 truncate">{user.name}</p>
                                                    <p className="text-xs text-slate-500">{user.lastSeen}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                        </CardContent>
                        <div className="flex-shrink-0 p-4 border-t border-slate-700">
                            <Button 
                                className="w-full bg-slate-800 text-white border border-slate-700 hover:bg-red-600"
                                onClick={() => navigate('/lands')}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                나가기
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* 가운데 하단: 맵 정보 오버레이 */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-10">
                    <div className="bg-slate-900/95 backdrop-blur-md rounded-lg p-6 border border-slate-700 shadow-2xl">
                        <div className="flex items-center gap-3 mb-3">
                            <MapPin className="w-6 h-6 text-blue-400" />
                            <h3 className="text-xl font-bold text-white">{dummyMapInfo.name}</h3>
                        </div>
                        <p className="text-slate-300 text-sm mb-3">{land.description}</p>
                        <div className="flex gap-2">
                            <span className="text-xs px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded-full border border-blue-600/30">
                                {dummyMapInfo.terrain}
                            </span>
                            <span className="text-xs px-3 py-1.5 bg-purple-600/20 text-purple-400 rounded-full border border-purple-600/30">
                                {dummyMapInfo.climate}
                            </span>
                            <span className="text-xs px-3 py-1.5 bg-green-600/20 text-green-400 rounded-full border border-green-600/30">
                                {dummyMapInfo.size}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 오른쪽: 동적 패널 */}
                <div className="absolute right-0 top-0 bottom-0 w-80 p-4 overflow-y-auto">
                    {rightPanelType === 'mapInfo' ? (
                        // 맵 정보
                        <div className="space-y-4">
                            <Card className="bg-slate-900/95 border-slate-800 backdrop-blur-md">
                                <CardHeader>
                                    <CardTitle className="text-white text-lg">기본 정보</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Mountain className="w-4 h-4 text-blue-400" />
                                        <div>
                                            <p className="text-xs text-slate-500">크기</p>
                                            <p className="text-sm text-white">{dummyMapInfo.size}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Thermometer className="w-4 h-4 text-orange-400" />
                                        <div>
                                            <p className="text-xs text-slate-500">기후</p>
                                            <p className="text-sm text-white">{dummyMapInfo.climate}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <MapPin className="w-4 h-4 text-green-400" />
                                        <div>
                                            <p className="text-xs text-slate-500">지형</p>
                                            <p className="text-sm text-white">{dummyMapInfo.terrain}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-900/95 border-slate-800 backdrop-blur-md">
                                <CardHeader>
                                    <CardTitle className="text-white text-lg">보유 자원</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {dummyMapInfo.resources.map((resource, index) => (
                                            <span 
                                                key={index}
                                                className="text-xs px-3 py-1.5 bg-slate-800 text-slate-300 rounded-full border border-slate-700"
                                            >
                                                {resource}
                                            </span>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-900/95 border-slate-800 backdrop-blur-md">
                                <CardHeader>
                                    <CardTitle className="text-white text-lg flex items-center gap-2">
                                        <Hammer className="w-4 h-4 text-yellow-400" />
                                        건물 목록
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {dummyMapInfo.buildings.map((building) => (
                                        <div 
                                            key={building.id}
                                            className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-white">{building.name}</p>
                                                <p className="text-xs text-slate-500">{building.type}</p>
                                            </div>
                                            <div className="text-xs px-2 py-1 bg-blue-600/20 text-blue-400 rounded border border-blue-600/30">
                                                Lv.{building.level}
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    ) : rightPanelType === 'userDetail' && selectedUser ? (
                        // 유저 상세 정보
                        <div className="space-y-4">
                            <Card className="bg-slate-900/95 border-slate-800 backdrop-blur-md">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-white text-lg">유저 정보</CardTitle>
                                        <Button 
                                            variant="ghost" 
                                            size="icon"
                                            className="h-8 w-8 text-slate-400 hover:text-blue-400 hover:bg-slate-800"
                                            onClick={handleBackToMapInfo}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex flex-col items-center gap-4 pb-4 border-b border-slate-700">
                                        <div className="relative">
                                            <img 
                                                src={selectedUser.avatar} 
                                                alt={selectedUser.name}
                                                className="w-24 h-24 rounded-full"
                                            />
                                            <span className={`absolute bottom-2 right-2 w-4 h-4 ${selectedUser.isOnline ? 'bg-green-500' : 'bg-slate-600'} border-2 border-slate-900 rounded-full`}></span>
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-xl font-bold text-white mb-1">{selectedUser.name}</h3>
                                            <p className={`text-sm ${selectedUser.isOnline ? 'text-green-400' : 'text-slate-500'}`}>
                                                {selectedUser.isOnline ? '온라인' : selectedUser.lastSeen}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                                            <Mail className="w-5 h-5 text-blue-400" />
                                            <div>
                                                <p className="text-xs text-slate-500">이메일</p>
                                                <p className="text-sm text-white">{selectedUser.name.toLowerCase()}@ailand.com</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                                            <Calendar className="w-5 h-5 text-purple-400" />
                                            <div>
                                                <p className="text-xs text-slate-500">가입일</p>
                                                <p className="text-sm text-white">2024년 11월 1일</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                                            <Award className="w-5 h-5 text-yellow-400" />
                                            <div>
                                                <p className="text-xs text-slate-500">레벨</p>
                                                <p className="text-sm text-white">레벨 {Math.floor(Math.random() * 20) + 5}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-700">
                                        <h4 className="text-sm font-semibold text-white mb-3">활동 뱃지</h4>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="text-xs px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded-full border border-blue-600/30">
                                                초기 멤버
                                            </span>
                                            <span className="text-xs px-3 py-1.5 bg-purple-600/20 text-purple-400 rounded-full border border-purple-600/30">
                                                활동적인
                                            </span>
                                            <span className="text-xs px-3 py-1.5 bg-green-600/20 text-green-400 rounded-full border border-green-600/30">
                                                친구 많은
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pt-4 space-y-2">
                                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                            메시지 보내기
                                        </Button>
                                        <Button className="w-full bg-slate-800 text-white border border-slate-700 hover:bg-slate-700">
                                            친구 추가
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : null}
                </div>

            </div>
        </div>
    )
}

