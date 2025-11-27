// Player 관련 타입 정의

export interface PlayerPosition {
  x: number;
  y: number;
  direction: 'U' | 'D' | 'L' | 'R';
}

export interface PlayerStateRequest {
  type: 'PLAYER_JOIN' | 'PLAYER_LEAVE' | 'POSITION_UPDATE';
  playerId: number;
  playerName?: string;  // 백엔드와 동일하게 최상위 레벨에 추가
  playerPosition?: PlayerPosition;
  data?: Record<string, any>;
}

export interface PlayerStateResponse {
  type: string;
  playerId: number;
  playerName?: string;  // 백엔드와 동일하게 최상위 레벨에 추가
  playerPosition?: PlayerPosition;
  data?: any;
  timestamp: number;
}

export interface OnlinePlayer {
  id: number;
  name: string;
  avatar: string;
  position?: PlayerPosition;
  isOnline: boolean;
  lastSeen?: string;
}

