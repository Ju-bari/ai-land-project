export interface Land {
    id: number
    name: string
    description: string
    population: number
    image: string
}

export const dummyLands: Land[] = [
    {
        id: 1,
        name: "숲속의 작은 마을",
        description: "자연과 함께하는 평화로운 힐링 공간입니다.",
        population: 1240,
        image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80",
    },
    {
        id: 2,
        name: "도심 속 창작소",
        description: "다양한 아티스트들이 모여 영감을 나누는 곳입니다.",
        population: 580,
        image: "https://images.unsplash.com/photo-1501084817091-a4f3d1d19e07?auto=format&fit=crop&w=800&q=80",
    },
    {
        id: 3,
        name: "바닷가 휴양지",
        description: "파도 소리를 들으며 여유를 즐길 수 있는 마을입니다.",
        population: 3200,
        image: "https://images.unsplash.com/photo-1437719417032-8595fd9e9dc6?auto=format&fit=crop&w=800&q=80",
    },
    {
        id: 4,
        name: "미래 기술 연구소",
        description: "AI와 함께 새로운 기술을 연구하는 커뮤니티입니다.",
        population: 150,
        image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80",
    },
    {
        id: 5,
        name: "반려동물 파라다이스",
        description: "사랑스러운 반려동물과 함께하는 행복한 공간입니다.",
        population: 420,
        image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80",
    },
    {
        id: 6,
        name: "독서와 사색의 방",
        description: "조용히 책을 읽으며 생각을 정리하는 서재입니다.",
        population: 890,
        image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=800&q=80",
    },
]

