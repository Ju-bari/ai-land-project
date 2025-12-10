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
import { getAccessToken } from '@/domains/user/utils/tokenManager';
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
    console.log('🔌 WebSocket 연결 시도 - playerId (userId):', playerId);
    
    // playerId가 없으면 연결하지 않음
    if (!playerId || playerId <= 0) {
      console.error('❌ Invalid playerId (userId):', playerId);
      return;
    }

    const token = getAccessToken();
    
    if (!token) {
      console.error('❌ No access token found');
      return;
    }
    
    console.log('✅ WebSocket 연결 준비 완료 - userId:', playerId);

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
        console.log('🔔 원본 메시지 수신:', message.body);
        const response: PlayerStateResponse = JSON.parse(message.body);
        console.log('🔔 파싱된 응답:', response);
        console.log('🔔 응답 필드 확인:', {
          t: response.t,
          p: response.p,
          playerInfoList: response.playerInfoList,
          playerPositionList: response.playerPositionList,
          x: response.x,
          y: response.y,
          d: response.d
        });

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
    const { t: type, p: responsePlayerId } = response;  // 백엔드의 축약형 필드명: t, p
    
    console.log('📩 메시지 수신:', { type, playerId: responsePlayerId, response });

    switch (type) {
      case 'P_JOIN': {
        // P_JOIN 응답: 새 유저가 조인했을 때 전체 플레이어 리스트와 위치 정보를 받음
        // - playerInfoList: 맵에 있는 모든 플레이어 정보 (playerId, name)
        // - playerPositionList: 각 플레이어의 현재 위치 (실시간 최신 위치)
        const { playerInfoList, playerPositionList } = response;
        
        console.log('🆕 P_JOIN 응답 - 새 유저 조인:', responsePlayerId);
        console.log('📋 전체 플레이어 정보:', { 
          playerInfoList, 
          playerPositionList,
          infoCount: playerInfoList?.length,
          positionCount: playerPositionList?.length
        });
        
        if (playerInfoList && playerInfoList.length > 0) {
          const newPlayers: OnlinePlayer[] = [];
          
          setOnlinePlayers((prev) => {
            const updated = new Map(prev);
            
            // 모든 플레이어 정보를 업데이트 (기존 유저 + 새 유저)
            playerInfoList.forEach((info) => {
              const positionData = playerPositionList?.find(p => p.playerId === info.playerId);
              
              // 기존 플레이어인지 확인
              const isExistingPlayer = updated.has(info.playerId);
              
              const player: OnlinePlayer = {
                id: info.playerId,
                name: info.name || `Player ${info.playerId}`,
                avatar: '/players/player1.png',
                position: positionData ? {
                  x: positionData.x,
                  y: positionData.y,
                  direction: numberToDirection(positionData.d),
                } : {
                  // 위치 정보가 없으면 초기 스폰 위치 사용
                  x: INITIAL_SPAWN_POSITION.x,
                  y: INITIAL_SPAWN_POSITION.y,
                  direction: INITIAL_SPAWN_POSITION.direction,
                },
                isOnline: true,
              };
              
              updated.set(info.playerId, player);
              
              if (!isExistingPlayer) {
                newPlayers.push(player);
              }
              
              console.log(isExistingPlayer ? '🔄 기존 플레이어 위치 업데이트:' : '👤 새 플레이어 추가:', {
                id: player.id,
                name: player.name,
                position: player.position
              });
            });
            
            console.log('✅ 전체 플레이어 목록 최신화 완료:', updated.size, '명');
            console.log('📋 현재 온라인:', Array.from(updated.values()).map(p => `${p.name}(${p.id})`).join(', '));
            return updated;
          });
          
          // 새로 추가된 플레이어들에 대해 콜백 호출
          newPlayers.forEach(player => {
            onPlayerJoin?.(player);
          });
        } else {
          console.log('⚠️ playerInfoList가 비어있거나 없습니다');
        }
        break;
      }

      case 'P_LEAVE': {
        setOnlinePlayers((prev) => {
          const updated = new Map(prev);
          const wasDeleted = updated.delete(responsePlayerId);
          console.log('👋 플레이어 퇴장:', responsePlayerId, '| 삭제됨:', wasDeleted, '| 총 접속자:', updated.size);
          return updated;
        });

        onPlayerLeave?.(responsePlayerId);
        break;
      }

      case 'P_MOVE': {
        // P_MOVE 응답: 플레이어의 위치가 업데이트됨 (실시간 위치 동기화)
        const { x, y, d } = response;
        
        if (x !== undefined && y !== undefined && d !== undefined) {
          console.log('🏃 P_MOVE - 위치 업데이트:', {
            playerId: responsePlayerId,
            x,
            y,
            direction: d,
            directionName: numberToDirection(d)
          });
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
              
              console.log('✅ 위치 업데이트 완료:', {
                playerId: updatedPlayer.id,
                name: updatedPlayer.name,
                oldPosition: existingPlayer.position,
                newPosition: updatedPlayer.position
              });
              
              onPlayerUpdate?.(updatedPlayer);
            } else {
              console.warn('⚠️ 플레이어를 찾을 수 없음:', responsePlayerId);
            }
            
            return updated;
          });
        } else {
          console.warn('⚠️ P_MOVE 데이터 불완전:', { x, y, d });
        }
        break;
      }

      default:
        console.warn('⚠️ 알 수 없는 메시지 타입:', type);
    }
  }, [onPlayerJoin, onPlayerLeave, onPlayerUpdate]);

  // P_JOIN 메시지 전송
  const sendPlayerJoin = useCallback((client: Client) => {
    if (!client.connected) return;
    if (!playerId || playerId <= 0) {
      console.error('❌ Cannot send P_JOIN: invalid playerId:', playerId);
      return;
    }

    const message: PlayerStateRequest = {
      t: 'P_JOIN',  // type -> t
      p: playerId,  // p 필드에 userId 값 전송 (playerId 파라미터에는 실제로 userId가 들어옴)
    };

    console.log('📤 P_JOIN 메시지 전송:', message);
    console.log('📤 전송할 JSON:', JSON.stringify(message));

    client.publish({
      destination: `/app/map/${mapId}`,
      body: JSON.stringify(message),
    });

    console.log('✅ P_JOIN 메시지 전송 완료 - userId:', playerId);
  }, [mapId, playerId]);

  // P_LEAVE 메시지 전송
  const sendPlayerLeave = useCallback((client: Client) => {
    if (!client.connected) return;
    if (!playerId || playerId <= 0) {
      console.error('Cannot send P_LEAVE: invalid playerId');
      return;
    }

    const message: PlayerStateRequest = {
      t: 'P_LEAVE',  // type -> t
      p: playerId,   // p 필드에 userId 값 전송 (playerId 파라미터에는 실제로 userId가 들어옴)
    };

    client.publish({
      destination: `/app/map/${mapId}`,
      body: JSON.stringify(message),
    });

    console.log('Sent P_LEAVE message:', { userId: playerId });
  }, [mapId, playerId]);

  // 위치 업데이트 메시지 전송 (본인의 위치가 변경될 때 호출)
  // 사용 예시: sendPositionUpdate(newX, newY, 'U') - 플레이어가 움직일 때마다 호출
  const sendPositionUpdate = useCallback((x: number, y: number, direction: 'U' | 'D' | 'L' | 'R') => {
    if (!clientRef.current?.connected) {
      console.warn('⚠️ WebSocket 연결되지 않음 - 위치 업데이트 불가');
      return;
    }
    
    if (!playerId || playerId <= 0) {
      console.error('❌ Cannot send P_MOVE: invalid playerId');
      return;
    }

    const message: PlayerStateRequest = {
      t: 'P_MOVE',  // type -> t
      p: playerId,  // p 필드에 userId 값 전송 (playerId 파라미터에는 실제로 userId가 들어옴)
      x,
      y,
      d: directionToNumber(direction),  // direction -> d (숫자 변환: U=1, D=2, L=3, R=4)
    };

    console.log('📤 P_MOVE 전송:', {
      playerId,
      x,
      y,
      direction,
      directionNumber: directionToNumber(direction),
      message
    });

    clientRef.current.publish({
      destination: `/app/map/${mapId}`,
      body: JSON.stringify(message),
    });
    
    console.log('✅ P_MOVE 전송 완료');
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

