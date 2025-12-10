import { useEffect, useRef, useState, useCallback } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {
  PlayerStateRequest,
  PlayerStateResponse,
  OnlinePlayer,
  directionToNumber,
  numberToDirection
} from '../types/player.types';
import { getAccessToken, clearAllTokens } from '@/domains/user/utils/tokenManager';
import { refreshAccessToken } from '@/domains/user/api/userApi';
import { INITIAL_SPAWN_POSITION } from '../constants/mapConfig';

const BASE_URL = import.meta.env.VITE_BACKEND_SPRING_BASE_URL || 'http://localhost:8080';

interface UseMapWebSocketProps {
  mapId: number;
  playerId: number | null;  // 실제로는 userId 값이 전달됨 (user.id), null이면 연결 안 함
  onPlayerJoin?: (player: OnlinePlayer) => void;
  onPlayerLeave?: (playerId: number) => void;
  onPlayerUpdate?: (player: OnlinePlayer) => void;
}

export function useMapWebSocket({
  mapId,
  playerId,
  onPlayerJoin,
  onPlayerLeave,
  onPlayerUpdate,
}: UseMapWebSocketProps) {
  const clientRef = useRef<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlinePlayers, setOnlinePlayers] = useState<Map<number, OnlinePlayer>>(new Map());

  // WebSocket 연결
  useEffect(() => {
    // playerId가 없으면 연결하지 않음
    if (!playerId || playerId <= 0) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      console.warn('[WS] 토큰 없음 - 연결 불가');
      return;
    }

    // STOMP 클라이언트 생성
    const client = new Client({
      webSocketFactory: () => new SockJS(`${BASE_URL}/ws`),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    // 연결 성공 시
    client.onConnect = () => {
      console.log('[WS] 연결됨 - mapId:', mapId, 'playerId:', playerId);
      setIsConnected(true);

      // 1. 맵의 플레이어 상태 구독 (브로드캐스트: P_JOIN, P_LEAVE, P_MOVE)
      client.subscribe(`/topic/map/${mapId}`, (message: IMessage) => {
        const response: PlayerStateResponse = JSON.parse(message.body);
        handlePlayerStateResponse(response);
      });

      // 2. 본인 전용 초기화 메시지 구독 (P_Init: 전체 플레이어 목록)
      client.subscribe(`/user/queue/map/${mapId}/init`, (message: IMessage) => {
        const response: PlayerStateResponse = JSON.parse(message.body);
        handlePlayerStateResponse(response);
      });

      // 연결 후 JOIN 메시지 전송
      sendPlayerJoin(client);
    };

    // 연결 실패 시 (JWT 인증 실패 포함)
    client.onStompError = async (frame) => {
      const errorMessage = frame.headers['message'] || '';
      console.error('[WS] 에러:', errorMessage);
      setIsConnected(false);

      // JWT 인증 실패 감지
      const isAuthError =
        errorMessage.toLowerCase().includes('invalid') ||
        errorMessage.toLowerCase().includes('expired') ||
        errorMessage.toLowerCase().includes('unauthorized') ||
        errorMessage.toLowerCase().includes('jwt');

      if (isAuthError) {
        try {
          const newToken = await refreshAccessToken();
          client.connectHeaders = { Authorization: `Bearer ${newToken}` };
          client.activate();
        } catch {
          clearAllTokens();
          window.location.href = '/login';
        }
      }
    };

    // 연결 끊김 시
    client.onDisconnect = () => {
      console.log('[WS] 연결 해제됨');
      setIsConnected(false);
    };

    // 연결 활성화
    client.activate();
    clientRef.current = client;

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (clientRef.current?.connected) {
        sendPlayerLeave(clientRef.current);
        clientRef.current.deactivate();
      }
    };
  }, [mapId, playerId]);

  // 플레이어 상태 응답 처리
  const handlePlayerStateResponse = useCallback((response: PlayerStateResponse) => {
    const { t: type, p: responsePlayerId } = response;

    switch (type) {
      // P_Init: 본인이 입장했을 때 전체 플레이어 목록 수신
      case 'P_Init': {
        const { playerInfoList, playerPositionList } = response;
        console.log('[WS] 초기화 - 플레이어 수:', playerInfoList?.length || 0);

        if (playerInfoList && playerInfoList.length > 0) {
          setOnlinePlayers(() => {
            const updated = new Map<number, OnlinePlayer>();

            playerInfoList.forEach((info) => {
              const positionData = playerPositionList?.find(p => p.playerId === info.playerId);

              const player: OnlinePlayer = {
                id: info.playerId,
                name: info.name || `Player ${info.playerId}`,
                avatar: '/players/player1.png',
                position: positionData ? {
                  x: positionData.x,
                  y: positionData.y,
                  direction: numberToDirection(positionData.d),
                } : {
                  x: INITIAL_SPAWN_POSITION.x,
                  y: INITIAL_SPAWN_POSITION.y,
                  direction: INITIAL_SPAWN_POSITION.direction,
                },
                isOnline: true,
              };

              updated.set(info.playerId, player);
            });

            return updated;
          });
        }
        break;
      }

      // P_JOIN: 다른 유저가 입장했을 때
      case 'P_JOIN': {
        const { po } = response;

        setOnlinePlayers((prev) => {
          const updated = new Map(prev);

          // 이미 존재하는 플레이어면 스킵
          if (updated.has(responsePlayerId)) {
            return prev;
          }

          const player: OnlinePlayer = {
            id: responsePlayerId,
            name: `Player ${responsePlayerId}`,
            avatar: '/players/player1.png',
            position: po ? {
              x: po.x,
              y: po.y,
              direction: numberToDirection(po.d),
            } : {
              x: INITIAL_SPAWN_POSITION.x,
              y: INITIAL_SPAWN_POSITION.y,
              direction: INITIAL_SPAWN_POSITION.direction,
            },
            isOnline: true,
          };

          updated.set(responsePlayerId, player);
          console.log('[WS] 플레이어 입장:', responsePlayerId, '현재:', updated.size);

          onPlayerJoin?.(player);
          return updated;
        });
        break;
      }

      case 'P_LEAVE': {
        setOnlinePlayers((prev) => {
          const updated = new Map(prev);
          updated.delete(responsePlayerId);
          console.log('[WS] 플레이어 퇴장:', responsePlayerId, '현재:', updated.size);
          return updated;
        });

        onPlayerLeave?.(responsePlayerId);
        break;
      }

      case 'P_MOVE': {
        const { x, y, d } = response;

        if (x !== undefined && y !== undefined && d !== undefined) {
          setOnlinePlayers((prev) => {
            const updated = new Map(prev);
            const existingPlayer = updated.get(responsePlayerId);

            if (existingPlayer) {
              const updatedPlayer: OnlinePlayer = {
                ...existingPlayer,
                position: {
                  x,
                  y,
                  direction: numberToDirection(d),
                },
              };
              updated.set(responsePlayerId, updatedPlayer);
              onPlayerUpdate?.(updatedPlayer);
            }

            return updated;
          });
        }
        break;
      }

      default:
        console.warn('[WS] 알 수 없는 타입:', type);
    }
  }, [onPlayerJoin, onPlayerLeave, onPlayerUpdate]);

  // P_JOIN 메시지 전송
  const sendPlayerJoin = useCallback((client: Client) => {
    if (!client.connected || !playerId || playerId <= 0) return;

    const message: PlayerStateRequest = {
      t: 'P_JOIN',
      p: playerId,
    };

    client.publish({
      destination: `/app/map/${mapId}`,
      body: JSON.stringify(message),
    });
  }, [mapId, playerId]);

  // P_LEAVE 메시지 전송
  const sendPlayerLeave = useCallback((client: Client) => {
    if (!client.connected || !playerId || playerId <= 0) return;

    const message: PlayerStateRequest = {
      t: 'P_LEAVE',
      p: playerId,
    };

    client.publish({
      destination: `/app/map/${mapId}`,
      body: JSON.stringify(message),
    });
  }, [mapId, playerId]);

  // 위치 업데이트 메시지 전송
  const sendPositionUpdate = useCallback((x: number, y: number, direction: 'U' | 'D' | 'L' | 'R') => {
    if (!clientRef.current?.connected || !playerId || playerId <= 0) return;

    const message: PlayerStateRequest = {
      t: 'P_MOVE',
      p: playerId,
      x,
      y,
      d: directionToNumber(direction),
    };

    clientRef.current.publish({
      destination: `/app/map/${mapId}`,
      body: JSON.stringify(message),
    });
  }, [mapId, playerId]);

  // WebSocket 연결 해제 (외부에서 호출 가능)
  const disconnect = useCallback(() => {
    if (clientRef.current?.connected) {
      sendPlayerLeave(clientRef.current);
      clientRef.current.deactivate();
      setIsConnected(false);
      setOnlinePlayers(new Map());
    }
  }, [sendPlayerLeave]);

  return {
    isConnected,
    onlinePlayers: Array.from(onlinePlayers.values()),
    sendPositionUpdate,
    disconnect,
  };
}
