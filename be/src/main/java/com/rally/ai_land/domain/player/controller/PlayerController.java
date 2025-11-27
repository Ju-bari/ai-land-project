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
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@Slf4j
public class PlayerController {

    private final PlayerService playerService;


    @MessageMapping("/map/{mapId}") // /app/map/{mapId}
    @SendTo("/topic/map/{mapId}") // /topic/map/{mapId}
    public PlayerStateResponse updatePlayerState(@DestinationVariable("mapId") Long mapId,
                                               PlayerStateRequest playerStateRequest,
                                               SimpMessageHeaderAccessor simpMessageHeaderAccessor) {
        log.info("보내는 메시지 목적지 맵 아이디  : {}", mapId);
        log.info("보내는 메시지 타입           : {}", playerStateRequest.getType());

        return playerService.handlePlayerState(mapId, playerStateRequest, simpMessageHeaderAccessor.getSessionId());
    }
}
