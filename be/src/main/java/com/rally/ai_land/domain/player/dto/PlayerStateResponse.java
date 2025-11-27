package com.rally.ai_land.domain.player.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PlayerStateResponse {

    private final String type;

    private final Long playerId;

    private String playerName;

    private final PlayerPosition playerPosition;

    private final Object data;

    private final Long timestamp;
}
