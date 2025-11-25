export interface MapInfo {
    name: string
    size: string
    terrain: string
    climate: string
    resources: string[]
    buildings: Building[]
}

export interface Building {
    id: number
    name: string
    type: string
    level: number
}

export const dummyMapInfo: MapInfo = {
    name: "중앙 광장",
    size: "500m × 500m",
    terrain: "평지",
    climate: "온대",
    resources: ["나무", "돌", "철광석", "금"],
    buildings: [
        {
            id: 1,
            name: "타운홀",
            type: "관리",
            level: 3,
        },
        {
            id: 2,
            name: "커뮤니티 센터",
            type: "사교",
            level: 2,
        },
        {
            id: 3,
            name: "상점",
            type: "상업",
            level: 4,
        },
        {
            id: 4,
            name: "공원",
            type: "휴식",
            level: 1,
        },
        {
            id: 5,
            name: "작업장",
            type: "생산",
            level: 3,
        },
    ],
}

