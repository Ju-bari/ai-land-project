/**
 * 맵 설정 상수
 */

// 맵 크기 (픽셀 단위)
export const MAP_CONFIG = {
  // map1.tmj: 50 tiles × 28 tiles, 32px per tile
  width: 1600,   // 50 × 32
  height: 896,   // 28 × 32
  tileSize: 32,
} as const

// 초기 스폰 위치 (백엔드와 동일하게 설정)
export const INITIAL_SPAWN_POSITION = {
  x: 800,
  y: 488,   // 백엔드 MAP_INIT_Y와 동일
  direction: 'D' as const,  // Down
} as const





