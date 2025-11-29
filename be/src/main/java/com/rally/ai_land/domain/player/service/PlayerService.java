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
    public PlayerStateResponse handlePlayerState(Long mapId,
                                                 PlayerStateRequest playerStateRequest) {
        switch (playerStateRequest.getType()) {
            case "P_JOIN":
                return handlePlayerJoin(mapId, (PlayerJoinRequest) playerStateRequest);

            case "P_LEAVE":
                return handlePlayerLeave(mapId, (PlayerLeaveRequest) playerStateRequest);

            case "P_POSITION_UPDATE":
                return handlePositionUpdate((PlayerPositionUpdateRequest) playerStateRequest);

            default:
                throw new IllegalArgumentException("알 수 없는 message type: " + playerStateRequest.getType());
        }
    }

    private PlayerStateResponse handlePlayerJoin(Long mapId, PlayerJoinRequest request) {
        // 업데이트
        stateManagerService.registerPlayerMapOnline(mapId, request.getPlayerId());
        stateManagerService.addPlayerInfo(request.getPlayerId());
        stateManagerService.addOrInitializePlayerPosition(request.getPlayerId(), 0, 0); // 우선 초기값 0

        return PlayerJoinResponse.builder()
                .type(request.getType())
                .playerId(request.getPlayerId())
                .playerInfoList(stateManagerService.getPlayerMapOnline(mapId))
                .playerPositionList(stateManagerService.getAllPlayerPositions(mapId))
                .build();
    }

    private PlayerStateResponse handlePlayerLeave(Long mapId, PlayerLeaveRequest request) {
        // 업데이트
        stateManagerService.removePlayerMapOnline(request.getPlayerId());

        return PlayerLeaveResponse.builder()
                .type(request.getType())
                .playerId(request.getPlayerId())
                .build();
    }

    private PlayerStateResponse handlePositionUpdate(PlayerPositionUpdateRequest request) {
        // 업데이트
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
