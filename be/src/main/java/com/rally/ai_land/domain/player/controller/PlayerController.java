package com.rally.ai_land.domain.player.controller;

import com.rally.ai_land.domain.chat.dto.ChatMessageSendRequest;
import com.rally.ai_land.domain.chat.dto.ChatMessageSendResponse;
import com.rally.ai_land.domain.player.dto.PlayerStateRequest;
import com.rally.ai_land.domain.player.dto.PlayerStateResponse;
import com.rally.ai_land.domain.player.service.PlayerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequiredArgsConstructor
@Slf4j
public class PlayerController {

    private final PlayerService playerService;


    // TODO: @Valid 고려
    // TODO: 보안 고려
    @MessageMapping("/map/{mapId}") // /app/map/{mapId}
//    @SendTo("/topic/map/{mapId}") // /topic/map/{mapId}
    public void updatePlayerState(@DestinationVariable("mapId") Long mapId,
                                  @Payload PlayerStateRequest playerStateRequest,
                                  SimpMessageHeaderAccessor simpMessageHeaderAccessor,
                                  Principal principal) {
        log.info("[받은 메시지] 목적지 맵 아이디  : {}", mapId);
        log.info("[받은 메시지] 보낸 유저 아이디  : {}", playerStateRequest.getPlayerId());
        log.info("[받은 메시지] 보낸 유저 이름   : {}", principal.getName());
        log.info("[받은 메시지] 타입           : {}", playerStateRequest.getType());

        playerService.handlePlayerState(simpMessageHeaderAccessor.getSessionId(),
                principal.getName(), // Spring Security 의 UserDetails.getUsername() 값
                mapId,
                playerStateRequest);
    }
}
