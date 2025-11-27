package com.rally.ai_land.domain.player.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PlayerPosition {

    private final Double x;

    private final Double y;

    private final String direction; // 'U', 'D', 'L', 'R'
}
