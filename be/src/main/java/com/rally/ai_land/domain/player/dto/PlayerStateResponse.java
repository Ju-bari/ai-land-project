package com.rally.ai_land.domain.player.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.Builder;
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
        @JsonSubTypes.Type(value = PlayerJoinResponse.class, name = "P_JOIN"),
        @JsonSubTypes.Type(value = PlayerLeaveResponse.class, name = "P_LEAVE"),
        @JsonSubTypes.Type(value = PlayerPositionUpdateResponse.class, name = "P_MOVE")
})
public abstract class PlayerStateResponse {

    @JsonProperty("t")
    private String type;

    @JsonProperty("p")
    private Long playerId;
}
