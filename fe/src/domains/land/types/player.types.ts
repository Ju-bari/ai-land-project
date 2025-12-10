// Player 관련 타입 정의

export interface PlayerPosition {
  x: number;
  y: number;
  direction: 'U' | 'D' | 'L' | 'R';
}

// 백엔드로 전송하는 요청 (축약된 필드명 사용)
export interface PlayerStateRequest {
  t: 'P_JOIN' | 'P_LEAVE' | 'P_MOVE';  // type -> t
  p: number;  // playerId -> p (실제로는 userId 값이 들어감)
  x?: number;
  y?: number;
  d?: number;  // direction -> d (1:상, 2:하, 3:좌, 4:우)
}

// 백엔드에서 받는 응답 (백엔드의 축약형 필드명에 맞춤)
export interface PlayerStateResponse {
  t: string;  // type -> t (축약형)
  p: number;  // playerId -> p (축약형)
  playerInfoList?: PlayerInfo[];  // P_JOIN 시 전체 플레이어 정보
  playerPositionList?: PlayerPositionData[];  // P_JOIN 시 전체 플레이어 위치
  x?: number;  // P_MOVE 시 x 좌표
  y?: number;  // P_MOVE 시 y 좌표
  d?: number;  // P_MOVE 시 방향 (1:상, 2:하, 3:좌, 4:우)
}

// 백엔드 PlayerInfo 클래스와 매칭
export interface PlayerInfo {
  playerId: number;
  name: string;  // playerName이 아니라 name
}

// 백엔드 PlayerPosition 클래스와 매칭
export interface PlayerPositionData {
  playerId: number;
  x: number;
  y: number;
  d: number;  // dir이 아니라 d
}

export interface OnlinePlayer {
  id: number;
  name: string;
  avatar: string;
  position?: PlayerPosition;
  isOnline: boolean;
  lastSeen?: string;
}

// Direction 변환 유틸리티
export const directionToNumber = (dir: 'U' | 'D' | 'L' | 'R'): number => {
  const map = { U: 1, D: 2, L: 3, R: 4 };
  return map[dir];
};

export const numberToDirection = (num: number): 'U' | 'D' | 'L' | 'R' => {
  const map = { 1: 'U', 2: 'D', 3: 'L', 4: 'R' } as const;
  return map[num as 1 | 2 | 3 | 4] || 'D';
};

