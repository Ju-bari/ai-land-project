package com.rally.ai_land.domain.player.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.Data;

@Data
@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.EXISTING_PROPERTY,
        property = "t",
        visible = true
)
@JsonSubTypes({
        @JsonSubTypes.Type(value = PlayerJoinRequest.class, name = "P_JOIN"),
        @JsonSubTypes.Type(value = PlayerLeaveRequest.class, name = "P_LEAVE"),
        @JsonSubTypes.Type(value = PlayerPositionUpdateRequest.class, name = "P_POSITION_UPDATE")
})
public abstract class PlayerStateRequest {

    // TODO: String type 최적화
    // 플레이어 입장 및 퇴장: "P_JOIN", "P_LEAVE"
    // 플레이어 포지션 업데이트: "P_POSITION_UPDATE"
    @JsonProperty("t")
    private String type;

    @JsonProperty("p")
    private Long playerId;
}
