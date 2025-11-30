package com.rally.ai_land.common.websocket;

import com.rally.ai_land.domain.player.dto.*;
import com.rally.ai_land.domain.player.service.PlayerService;
import com.rally.ai_land.domain.player.service.StateManagerService;
import com.rally.ai_land.domain.user.dto.PlayerSession;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final StateManagerService stateManagerService;
    private final PlayerService playerService;

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        String sessionId = event.getSessionId();

        PlayerSession session = stateManagerService.getSession(sessionId);

        playerService.handlePlayerLeave(sessionId,
                session.getMapId(),
                PlayerLeaveRequest.builder()
                        .type(ActionType.P_LEAVE)
                        .playerId(session.getPlayerId())
                        .build());
    }
}
