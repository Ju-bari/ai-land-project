export interface User {
    id: number
    name: string
    avatar: string
    isOnline: boolean
    lastSeen?: string
}

export const dummyUsers: User[] = [
    {
        id: 1,
        name: "김철수",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kim",
        isOnline: true,
    },
    {
        id: 2,
        name: "이영희",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lee",
        isOnline: true,
    },
    {
        id: 3,
        name: "박민수",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Park",
        isOnline: false,
        lastSeen: "5분 전",
    },
    {
        id: 4,
        name: "정수진",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jung",
        isOnline: true,
    },
    {
        id: 5,
        name: "최동욱",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Choi",
        isOnline: false,
        lastSeen: "1시간 전",
    },
    {
        id: 6,
        name: "강서연",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kang",
        isOnline: true,
    },
    {
        id: 7,
        name: "윤지호",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Yoon",
        isOnline: false,
        lastSeen: "30분 전",
    },
    {
        id: 8,
        name: "임하은",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lim",
        isOnline: true,
    },
]







