package com.rally.ai_land.domain.chat.controller;

import com.rally.ai_land.domain.chat.dto.ChatMessageSendRequest;
import com.rally.ai_land.domain.chat.dto.ChatMessageSendResponse;
import com.rally.ai_land.domain.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@Slf4j
public class WebSocketController {

    private final ChatService chatService;


    @MessageMapping("/send/{roomId}")
    @SendTo("/sub/{roomId}")
    public ChatMessageSendResponse sendChatMessage(@DestinationVariable("roomId") Long roomId, ChatMessageSendRequest chatMessageSendRequest) {
        log.info("보내는 메시지 룸 아이디 : {}", roomId);
        log.info("메시지 들어옴 : {}", chatMessageSendRequest.getMessage());
        log.info("메시지 DTO : \n{}", chatMessageSendRequest.toString());

        return chatService.sendChatMessage(roomId, chatMessageSendRequest);
    }
}
