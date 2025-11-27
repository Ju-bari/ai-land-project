package com.rally.ai_land.domain.user.controller;

import com.rally.ai_land.common.constant.CommonConstant;
import com.rally.ai_land.common.constant.CommonStatus;
import com.rally.ai_land.common.dto.CommonResponse;
import com.rally.ai_land.domain.user.dto.JwtResponse;
import com.rally.ai_land.domain.user.dto.RefreshRequest;
import com.rally.ai_land.domain.user.dto.UserRequest;
import com.rally.ai_land.domain.user.service.JwtRefreshService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class JwtController {

    private final JwtRefreshService jwtRefreshService;


    // 소셜 로그인 쿠키 방식의 Refresh 토큰 헤더 방식으로 교환
    // TODO: 공통 응답 형식으로 할지 말지
    @PostMapping(value = "/jwt/exchange",
            consumes = MediaType.APPLICATION_JSON_VALUE)
    public JwtResponse jwtExchange(
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        return jwtRefreshService.cookie2Header(request, response);
    }

    // Refresh 토큰으로 Access 토큰 재발급 (Rotate 포함)
    @PostMapping(value = "/jwt/refresh",
            consumes = MediaType.APPLICATION_JSON_VALUE)
    public JwtResponse jwtRefresh(
            @Validated @RequestBody RefreshRequest dto
    ) {
        return jwtRefreshService.refreshRotate(dto);
    }
}