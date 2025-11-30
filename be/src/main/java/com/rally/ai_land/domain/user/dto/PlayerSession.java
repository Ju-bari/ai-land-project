package com.rally.ai_land.domain.user.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PlayerSession {

    private final Long mapId;

    private final Long playerId;

}
