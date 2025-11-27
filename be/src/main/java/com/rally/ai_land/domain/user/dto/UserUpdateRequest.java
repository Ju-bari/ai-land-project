package com.rally.ai_land.domain.user.dto;

import lombok.Data;

@Data
public class UserUpdateRequest {

    private final String username;
    private final String nickname;
    private final String email;
}
