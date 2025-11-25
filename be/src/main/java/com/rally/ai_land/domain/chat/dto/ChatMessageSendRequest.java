package com.rally.ai_land.domain.chat.dto;

import lombok.Data;

@Data
public class ChatMessageSendRequest {

    private final ChatMessageType chatMessageType;

    private final String message;

    private final Long senderId;
}