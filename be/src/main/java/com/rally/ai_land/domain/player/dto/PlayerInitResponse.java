package com.rally.ai_land.domain.player.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Data
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class PlayerInitResponse extends PlayerStateResponse {

    private List<PlayerInfo> playerInfoList;

    private List<PlayerPosition> playerPositionList;
}
