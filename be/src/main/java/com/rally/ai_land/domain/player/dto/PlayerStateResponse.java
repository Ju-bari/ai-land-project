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
        @JsonSubTypes.Type(value = PlayerInitResponse.class, name = ActionType.P_Init),
        @JsonSubTypes.Type(value = PlayerJoinResponse.class, name = ActionType.P_JOIN),
        @JsonSubTypes.Type(value = PlayerLeaveResponse.class, name = ActionType.P_LEAVE),
        @JsonSubTypes.Type(value = PlayerPositionUpdateResponse.class, name = ActionType.P_MOVE)
})
public abstract class PlayerStateResponse {

    // P_INIT, P_JOIN, P_LEAVE, P_MOVE
    @JsonProperty("t")
    private String type;

    @JsonProperty("p")
    private Long playerId;
}
