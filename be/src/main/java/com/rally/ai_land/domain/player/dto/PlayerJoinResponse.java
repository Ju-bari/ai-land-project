package com.rally.ai_land.domain.player.dto;

import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Data
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class PlayerJoinResponse extends PlayerStateResponse {

    private List<PlayerInfo> playerInfoList;

    private List<PlayerPosition> playerPositionList;
}
