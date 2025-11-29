package com.rally.ai_land.domain.player.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class PlayerPositionUpdateResponse extends PlayerStateResponse {

    @JsonProperty("x")
    private double x; // 자료구조 고민

    @JsonProperty("y")
    private double y;

    @JsonProperty("d")
    private short dir; // 1234: 상하좌우
}
