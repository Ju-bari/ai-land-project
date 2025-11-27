import { useEffect, useRef, useState, useCallback } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { PlayerStateRequest, PlayerStateResponse, OnlinePlayer } from '../types/player.types';
import { getAccessToken } from '@/domains/user/utils/tokenManager';

const BASE_URL = import.meta.env.VITE_BACKEND_SPRING_BASE_URL || 'http://localhost:8080';

interface UseMapWebSocketProps {
  mapId: number;
  playerId: number;
  playerName: string;
  playerAvatar: string;
  onPlayerJoin?: (player: OnlinePlayer) => void;
  onPlayerLeave?: (playerId: number) => void;
  onPlayerUpdate?: (player: OnlinePlayer) => void;
}

export function useMapWebSocket({
  mapId,
  playerId,
  playerName,
  playerAvatar,
  onPlayerJoin,
  onPlayerLeave,
  onPlayerUpdate,
}: UseMapWebSocketProps) {
  const clientRef = useRef<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlinePlayers, setOnlinePlayers] = useState<Map<number, OnlinePlayer>>(new Map());

  // WebSocket 연결
  useEffect(() => {
    const token = getAccessToken();
    
    if (!token) {
      console.error('No access token found');
      return;
    }

    // STOMP 클라이언트 생성
    const client = new Client({
      webSocketFactory: () => new SockJS(`${BASE_URL}/ws`),
      connectHeaders: {
        // STOMP CONNECT 프레임에서 인증 처리
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        console.log('STOMP Debug:', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    // 연결 성공 시
    client.onConnect = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);

      // 맵의 플레이어 상태 구독
      client.subscribe(`/topic/map/${mapId}`, (message: IMessage) => {
        const response: PlayerStateResponse = JSON.parse(message.body);
        console.log('Received message:', response);

        handlePlayerStateResponse(response);
      });

      // 연결 후 JOIN 메시지 전송
      sendPlayerJoin(client);
    };

    // 연결 실패 시
    client.onStompError = (frame) => {
      console.error('STOMP Error:', frame.headers['message']);
      console.error('Details:', frame.body);
      setIsConnected(false);
    };

    // 연결 끊김 시
    client.onDisconnect = () => {
      console.log('WebSocket Disconnected');
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
    const { type, playerId: responsePlayerId, playerName: responseName, playerPosition, data } = response;
    
    console.log('📩 메시지 수신:', { type, playerId: responsePlayerId, playerName: responseName });

    switch (type) {
      case 'PLAYER_JOIN': {
        const newPlayer: OnlinePlayer = {
          id: responsePlayerId,
          name: responseName || `Player ${responsePlayerId}`,
          avatar: data?.playerAvatar || '/players/player1.png',
          position: playerPosition,
          isOnline: true,
        };

        setOnlinePlayers((prev) => {
          const updated = new Map(prev);
          updated.set(responsePlayerId, newPlayer);
          console.log('✅ 플레이어 추가됨:', newPlayer.name, '| 총 접속자:', updated.size);
          return updated;
        });

        onPlayerJoin?.(newPlayer);
        break;
      }

      case 'PLAYER_LEAVE': {
        setOnlinePlayers((prev) => {
          const updated = new Map(prev);
          const wasDeleted = updated.delete(responsePlayerId);
          console.log('👋 플레이어 퇴장:', responsePlayerId, '| 삭제됨:', wasDeleted, '| 총 접속자:', updated.size);
          return updated;
        });

        onPlayerLeave?.(responsePlayerId);
        break;
      }

      case 'POSITION_UPDATE': {
        setOnlinePlayers((prev) => {
          const updated = new Map(prev);
          const existingPlayer = updated.get(responsePlayerId);
          
          if (existingPlayer) {
            const updatedPlayer = {
              ...existingPlayer,
              position: playerPosition,
            };
            updated.set(responsePlayerId, updatedPlayer);
            onPlayerUpdate?.(updatedPlayer);
          }
          
          return updated;
        });
        break;
      }

      default:
        console.warn('⚠️ 알 수 없는 메시지 타입:', type);
    }
  }, [onPlayerJoin, onPlayerLeave, onPlayerUpdate]);

  // PLAYER_JOIN 메시지 전송
  const sendPlayerJoin = useCallback((client: Client) => {
    if (!client.connected) return;

    const message: PlayerStateRequest = {
      type: 'PLAYER_JOIN',
      playerId,
      playerName,  // 최상위 레벨에서 전송
      playerPosition: {
        x: 0,
        y: 0,
        direction: 'D',
      },
      data: {
        playerAvatar,
      },
    };

    client.publish({
      destination: `/app/map/${mapId}`,
      body: JSON.stringify(message),
    });

    console.log('Sent PLAYER_JOIN message:', { playerId, playerName });
  }, [mapId, playerId, playerName, playerAvatar]);

  // PLAYER_LEAVE 메시지 전송
  const sendPlayerLeave = useCallback((client: Client) => {
    if (!client.connected) return;

    const message: PlayerStateRequest = {
      type: 'PLAYER_LEAVE',
      playerId,
    };

    client.publish({
      destination: `/app/map/${mapId}`,
      body: JSON.stringify(message),
    });

    console.log('Sent PLAYER_LEAVE message');
  }, [mapId, playerId]);

  // 위치 업데이트 메시지 전송
  const sendPositionUpdate = useCallback((x: number, y: number, direction: 'U' | 'D' | 'L' | 'R') => {
    if (!clientRef.current?.connected) return;

    const message: PlayerStateRequest = {
      type: 'POSITION_UPDATE',
      playerId,
      playerPosition: { x, y, direction },
    };

    clientRef.current.publish({
      destination: `/app/map/${mapId}`,
      body: JSON.stringify(message),
    });
  }, [mapId, playerId]);

  // WebSocket 연결 해제 (외부에서 호출 가능)
  const disconnect = useCallback(() => {
    if (clientRef.current?.connected) {
      console.log('Manually disconnecting WebSocket...');
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

