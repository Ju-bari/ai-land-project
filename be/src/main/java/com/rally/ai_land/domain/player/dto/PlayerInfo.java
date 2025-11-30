package com.rally.ai_land.domain.player.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PlayerInfo {

    private Long playerId;

    private String name;
}