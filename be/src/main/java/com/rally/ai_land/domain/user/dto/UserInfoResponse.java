package com.rally.ai_land.domain.user.dto;

public record UserInfoResponse(Long userId, String username, Boolean social, String nickname, String email) {
}