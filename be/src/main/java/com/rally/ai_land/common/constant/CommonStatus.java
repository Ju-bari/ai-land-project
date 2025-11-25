package com.rally.ai_land.common.constant;

public enum CommonStatus implements Status {

    SUCCESS("성공"),
    FAIL("실패"),
    INTERNAL_SERVER_ERROR("서버 오류"),
    BAD_REQUEST("잘못된 요청");

    private final String description;

    private CommonStatus(String description) {
        this.description = description;
    }

    @Override
    public String getDescription() {
        return description;
    }

}
