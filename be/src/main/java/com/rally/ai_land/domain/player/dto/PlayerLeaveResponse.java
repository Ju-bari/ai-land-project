package com.rally.ai_land.domain.player.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class PlayerLeaveResponse extends PlayerStateResponse {

//    public PlayerLeaveResponse() {
//        setType("P_LEAVE");
//    }
}
