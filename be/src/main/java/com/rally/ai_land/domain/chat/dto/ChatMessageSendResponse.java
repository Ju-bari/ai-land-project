package com.rally.ai_land.domain.chat.dto;

import com.rally.ai_land.domain.chat.entity.ChatMessage;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ChatMessageSendResponse {

    private final ChatMessageType chatMessageType;

    private final String message;

    private final String username;

    private final LocalDateTime createdAt;

    public static ChatMessageSendResponse from(ChatMessage chatMessage) {
        return ChatMessageSendResponse.builder()
                .chatMessageType(chatMessage.getChatMessageType())
                .message(chatMessage.getMessage())
                .createdAt(chatMessage.getCreatedAt())
                .build();
    }
}
