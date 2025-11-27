package com.rally.ai_land.domain.player.service;

import com.rally.ai_land.domain.player.dto.PlayerStateRequest;
import com.rally.ai_land.domain.player.dto.PlayerStateResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PlayerService {

    // TODO: 레디스로 변경
    // LEAVE 의 경우 추가적인 EventListener 필요
    private final SessionManagerService sessionManagerService;

    public PlayerStateResponse handlePlayerState(Long mapId,
                                                 PlayerStateRequest playerStateRequest,
                                                 String sessionId) {
        switch (playerStateRequest.getType()) {
            case "PLAYER_JOIN":
                sessionManagerService.addPlayer(sessionId, playerStateRequest.getPlayerId(), mapId);
                return handlePlayerJoin(playerStateRequest);

            case "PLAYER_LEAVE":
                sessionManagerService.removeSession(sessionId);
                return handlePlayerLeave(playerStateRequest);

            case "POSITION_UPDATE":
                return handlePositionUpdate(playerStateRequest);

            default:
                throw new IllegalArgumentException("Unknown message type: " + playerStateRequest.getType());
        }
    }

    private PlayerStateResponse handlePlayerJoin(PlayerStateRequest playerStateRequest) {
        return PlayerStateResponse.builder()
                .type(playerStateRequest.getType())
                .playerId(playerStateRequest.getPlayerId())
                .playerName(playerStateRequest.getPlayerName())
                .timestamp(System.currentTimeMillis()) // TODO: 확인 필요
                .build();
    }

    private PlayerStateResponse handlePlayerLeave(PlayerStateRequest playerStateRequest) {
        return PlayerStateResponse.builder()
                .type(playerStateRequest.getType())
                .playerId(playerStateRequest.getPlayerId())
                .playerName(playerStateRequest.getPlayerName())
                .timestamp(System.currentTimeMillis()) // TODO: 확인 필요
                .build();
    }

    private PlayerStateResponse handlePositionUpdate(PlayerStateRequest playerStateRequest) {
        return PlayerStateResponse.builder()
                .type(playerStateRequest.getType())
                .playerId(playerStateRequest.getPlayerId())
                .playerName(playerStateRequest.getPlayerName())
                .playerPosition(playerStateRequest.getPlayerPosition())
                .timestamp(System.currentTimeMillis()) // TODO: 확인 필요
                .build();
    }
}
