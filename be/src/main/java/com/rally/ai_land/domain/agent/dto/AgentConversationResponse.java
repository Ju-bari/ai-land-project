package com.rally.ai_land.domain.agent.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AgentConversationResponse {

    private final String conversationId;
    private final List<String> currentMessages;
}
