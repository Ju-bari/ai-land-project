package com.rally.ai_land.domain.player.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class PlayerPositionUpdateRequest extends PlayerStateRequest {

    @JsonProperty("x")
    private double x; // TODO: 자료구조 고민

    @JsonProperty("y")
    private double y;

    @JsonProperty("d")
    private short dir; // 1234: 상하좌우
}
