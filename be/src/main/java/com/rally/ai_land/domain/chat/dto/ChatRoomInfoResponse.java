package com.rally.ai_land.domain.chat.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ChatRoomInfoResponse {

    private final Long id;

    private final String name;

    private final Long creatorId;

    private final String creatorName;

    private final LocalDateTime createdAt;
}
