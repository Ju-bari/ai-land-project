package com.rally.ai_land.domain.agent.dto;

import lombok.Data;

@Data
public class AgentConversationRequest {

    // 프론트에서 낮은 Id와 높은 Id를 순서대로 보내주기
    private Long agentIdA;
    private Long agentIdB;
}
