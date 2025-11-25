package com.rally.ai_land.domain.agent.dto;

import lombok.Data;

@Data
public class MessageOutput {

    private final String message;
    // TODO: 우선 불리언으로 해보기
    private final boolean doStop;
}
