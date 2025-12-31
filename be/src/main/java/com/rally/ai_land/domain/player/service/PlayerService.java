package com.rally.ai_land.domain.player.service;

import com.rally.ai_land.domain.player.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.security.Principal;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlayerService {

    // LEAVE 의 경우 추가적인 EventListener 필요
    private final StateManagerService stateManagerService;
    private final SimpMessagingTemplate simpMessagingTemplate;

    public static double MAP_INIT_X = 800;
    public static double MAP_INIT_Y = 488;
    public static short MAP_INIT_D = 2;

    // TODO: 비동기 처리 고려 (stateManager)
    public void handlePlayerState(String sessionId,
                                                 String username,
                                                 Long mapId,
                                                 PlayerStateRequest playerStateRequest) {
        switch (playerStateRequest.getType()) {
            case "P_JOIN":
                assert playerStateRequest instanceof PlayerJoinRequest;
                handlePlayerJoin(sessionId, username, mapId, (PlayerJoinRequest) playerStateRequest);
                return;
            case "P_LEAVE":
                assert playerStateRequest instanceof PlayerLeaveRequest;
                handlePlayerLeave(sessionId, mapId, (PlayerLeaveRequest) playerStateRequest);
                return;

            case "P_MOVE":
                assert playerStateRequest instanceof PlayerPositionUpdateRequest;
                handlePositionUpdate(mapId, (PlayerPositionUpdateRequest) playerStateRequest);
                return;

            default:
                throw new IllegalArgumentException("알 수 없는 message type: " + playerStateRequest.getType());
        }
    }

    private void handlePlayerJoin(String sessionId, String username, Long mapId, PlayerJoinRequest request) {
        // [상태 업데이트]
        stateManagerService.setSession(sessionId, mapId, request.getPlayerId());
        stateManagerService.registerPlayerMapOnline(mapId, request.getPlayerId());
        stateManagerService.addPlayerInfo(mapId, request.getPlayerId());
        stateManagerService.addOrInitializePlayerPosition(request.getPlayerId());

        log.info("현재 유저 목록 {}", stateManagerService.getPlayersMapOnline(mapId));

        // [본인 응답]
        // 실제 전송 경로: /user/{username}/queue/map/{mapId}
        simpMessagingTemplate.convertAndSendToUser(username,
                "/queue/map/" + mapId,
                PlayerInitResponse.builder()
                        .type(ActionType.P_Init)
                        .playerId(request.getPlayerId())
                        .playerInfoList(stateManagerService.getPlayersMapOnline(mapId))
                        .playerPositionList(stateManagerService.getAllPlayerPositions(mapId))
                        .build());

        // [타인 응답]
        // 실제 전송 경로: /topic/map/{mapId}
        simpMessagingTemplate.convertAndSend("/topic/map/" + mapId,
                PlayerJoinResponse.builder()
                        .type(request.getType())
                        .playerId(request.getPlayerId())
                        .name(request.getName())
                        .playerPosition(PlayerPosition.builder() // TODO: 초기화의 경우 맵 시작 정보도 불러와야 함
                                .playerId(request.getPlayerId()) // 불필요하긴 함
                                .x(MAP_INIT_X)
                                .y(MAP_INIT_Y)
                                .d(MAP_INIT_D)
                                .build())
                        .build());
    }

    // WebSocketEventListener 로 인해 public 접근
    public void handlePlayerLeave(String sessionId, Long mapId, PlayerLeaveRequest request) {
        stateManagerService.removeSession(sessionId);
        stateManagerService.removePlayerMapOnline(mapId, request.getPlayerId());

        simpMessagingTemplate.convertAndSend("/topic/map/" + mapId,
                PlayerLeaveResponse.builder()
                        .type(request.getType())
                        .playerId(request.getPlayerId())
                        .build());
    }

    private void handlePositionUpdate(Long mapId, PlayerPositionUpdateRequest request) {
        stateManagerService.updatePlayerPosition(request.getPlayerId(), request.getX(), request.getY(), request.getDir());

        simpMessagingTemplate.convertAndSend("/topic/map/" + mapId,
                PlayerPositionUpdateResponse.builder()
                        .type(request.getType())
                        .playerId(request.getPlayerId())
                        .x(request.getX())
                        .y(request.getY())
                        .dir(request.getDir())
                        .build());
    }
}
