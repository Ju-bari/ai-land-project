package com.rally.ai_land.domain.player.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Data
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class PlayerJoinResponse extends PlayerStateResponse {

    @JsonProperty("n")
    private String name;

    @JsonProperty("po")
    private PlayerPosition playerPosition;
}
