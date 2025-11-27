package com.rally.ai_land.domain.player.dto;

import lombok.Data;

import java.util.Map;

@Data
// TODO: 웹소켓용 DTO 라 최적화 부분 찾아야 하는지 조사 필요
public class PlayerStateRequest {

    private String type; // "PLAYER_JOIN", "PLAYER_LEAVE", "POSITION_UPDATE"

    private Long playerId; // userId

    private String playerName; // userName

    private PlayerPosition playerPosition;

    private Map<String, Object> data;
}
