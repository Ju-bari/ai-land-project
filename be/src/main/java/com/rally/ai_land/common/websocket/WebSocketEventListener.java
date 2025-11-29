package com.rally.ai_land.common.websocket;

import com.rally.ai_land.domain.player.dto.PlayerStateResponse;
import com.rally.ai_land.domain.player.service.PlayerService;
import com.rally.ai_land.domain.player.service.StateManagerService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final SimpMessagingTemplate messagingTemplate; // WebSocket 기본 구현
    private final StateManagerService stateManagerService;
    private final PlayerService playerService;

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        String sessionId = event.getSessionId();

        PlayerSession session = stateManagerService.removeSession(sessionId);

        if (session != null) {
            messagingTemplate.convertAndSend(
                    "/topic/map/" + session.getMapId(),
                    PlayerStateResponse.builder()
                            .type("PLAYER_LEAVE")
                            .playerId(session.getUserId())
                            .timestamp(System.currentTimeMillis())
                            .build());
        }
    }
}
