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
  n?: string;  // name -> n (P_JOIN 시 닉네임)
  x?: number;
  y?: number;
  d?: number;  // direction -> d (1:상, 2:하, 3:좌, 4:우)
}

// 백엔드에서 받는 응답 (백엔드의 축약형 필드명에 맞춤)
export interface PlayerStateResponse {
  t: string;  // type -> t (축약형): P_Init, P_JOIN, P_LEAVE, P_MOVE
  p: number;  // playerId -> p (축약형)

  // P_Init 응답 (본인에게만 전송됨 - /user/queue/map/{mapId}/init)
  playerInfoList?: PlayerInfo[];  // 전체 플레이어 정보
  playerPositionList?: PlayerPositionData[];  // 전체 플레이어 위치

  // P_JOIN 응답 (모든 클라이언트에게 브로드캐스트 - /topic/map/{mapId})
  n?: string;  // name -> n (닉네임)
  po?: PlayerPositionData;  // 새로 입장한 플레이어의 위치

  // P_MOVE 응답
  x?: number;
  y?: number;
  d?: number;  // direction (1:상, 2:하, 3:좌, 4:우)
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

