package com.rally.ai_land.domain.player.dto;

public final class ActionType {
    private ActionType() {} // 객체 생성 금지

    // TODO: String 이 아닌 숫자로 최적화
    public static final String P_Init = "P_Init";

    public static final String P_JOIN = "P_JOIN";

    public static final String P_LEAVE = "P_LEAVE";

    public static final String P_MOVE = "P_MOVE";
}