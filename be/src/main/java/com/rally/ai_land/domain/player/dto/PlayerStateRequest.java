package com.rally.ai_land.domain.player.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.EXISTING_PROPERTY,
        property = "t",
        visible = true
)
@JsonSubTypes({
        @JsonSubTypes.Type(value = PlayerJoinRequest.class, name = ActionType.P_JOIN),
        @JsonSubTypes.Type(value = PlayerLeaveRequest.class, name = ActionType.P_LEAVE),
        @JsonSubTypes.Type(value = PlayerPositionUpdateRequest.class, name = ActionType.P_MOVE)
})
public abstract class PlayerStateRequest {

    // TODO: String type 최적화
    // 플레이어 입장 및 퇴장: "P_JOIN", "P_LEAVE"
    // 플레이어 포지션 업데이트: "P_MOVE"
    @JsonProperty("t")
    private String type;

    @JsonProperty("p")
    private Long playerId;
}
