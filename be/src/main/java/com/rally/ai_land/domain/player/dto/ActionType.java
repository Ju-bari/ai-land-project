package com.rally.ai_land.domain.player.dto;

public final class ActionType {
    private ActionType() {} // 객체 생성 금지

    public static final String JOIN = "P_JOIN";
    public static final String LEAVE = "P_LEAVE";
    public static final String MOVE = "P_POSITION_UPDATE";
}