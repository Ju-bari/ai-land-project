package com.rally.ai_land.domain.player.service;

import com.rally.ai_land.domain.player.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PlayerService {

    // LEAVE 의 경우 추가적인 EventListener 필요
    private final StateManagerService stateManagerService;

    // TODO: 비동기 처리 고려 (stateManager)
    public PlayerStateResponse handlePlayerState(String sessionId,
                                                 Long mapId,
                                                 PlayerStateRequest playerStateRequest) {
        switch (playerStateRequest.getType()) {
            case "P_JOIN":
                return handlePlayerJoin(sessionId, mapId, (PlayerJoinRequest) playerStateRequest);

            case "P_LEAVE":
                return handlePlayerLeave(sessionId, mapId, (PlayerLeaveRequest) playerStateRequest);

            case "P_MOVE":
                return handlePositionUpdate((PlayerPositionUpdateRequest) playerStateRequest);

            default:
                throw new IllegalArgumentException("알 수 없는 message type: " + playerStateRequest.getType());
        }
    }

    private PlayerStateResponse handlePlayerJoin(String sessionId, Long mapId, PlayerJoinRequest request) {
        stateManagerService.setSession(sessionId, request.getPlayerId(), mapId);
        stateManagerService.registerPlayerMapOnline(mapId, request.getPlayerId());
        stateManagerService.addPlayerInfo(mapId, request.getPlayerId());
        stateManagerService.addOrInitializePlayerPosition(request.getPlayerId());

        return PlayerJoinResponse.builder()
                .type(request.getType())
                .playerId(request.getPlayerId())
                .playerInfoList(stateManagerService.getPlayerMapOnline(mapId))
                .playerPositionList(stateManagerService.getAllPlayerPositions(mapId))
                .build();
    }

    // WebSocketEventListener 로 인해 public 접근
    public PlayerStateResponse handlePlayerLeave(String sessionId, Long mapId, PlayerLeaveRequest request) {
        stateManagerService.removeSession(sessionId);
        stateManagerService.removePlayerMapOnline(mapId, request.getPlayerId());

        return PlayerLeaveResponse.builder()
                .type(request.getType())
                .playerId(request.getPlayerId())
                .build();
    }

    private PlayerStateResponse handlePositionUpdate(PlayerPositionUpdateRequest request) {
        stateManagerService.updatePlayerPosition(request.getPlayerId(), request.getX(), request.getY(), request.getDir());

        return PlayerPositionUpdateResponse.builder()
                .type(request.getType())
                .playerId(request.getPlayerId())
                .x(request.getX())
                .y(request.getY())
                .dir(request.getDir())
                .build();
    }
}
