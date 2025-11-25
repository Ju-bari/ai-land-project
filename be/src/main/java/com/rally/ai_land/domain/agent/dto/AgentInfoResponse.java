package com.rally.ai_land.domain.agent.dto;

import com.rally.ai_land.domain.agent.entity.Agent;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AgentInfoResponse {

    private final String name;

    public static AgentInfoResponse fromEntity(Agent agent) {
        return AgentInfoResponse.builder()
                .name(agent.getName())
                .build();
    }
}
