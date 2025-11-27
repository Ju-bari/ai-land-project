package com.rally.ai_land.domain.user.controller;

import com.rally.ai_land.common.constant.CommonConstant;
import com.rally.ai_land.common.constant.CommonStatus;
import com.rally.ai_land.common.dto.CommonResponse;
import com.rally.ai_land.domain.user.dto.UserRequest;
import com.rally.ai_land.domain.user.dto.UserInfoResponse;
import com.rally.ai_land.domain.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserService userService;


    // 자체 로그인 유저 존재 확인
    @PostMapping(value = "/users/exist",
            consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> existUser(
            @Validated(UserRequest.existGroup.class) @RequestBody UserRequest userRequest) {
        return ResponseEntity.ok(
                CommonResponse.<Boolean>builder()
                        .successOrNot(CommonConstant.YES_FLAG)
                        .statusCode(CommonStatus.SUCCESS)
                        .data(userService.existUser(userRequest))
                        .build());
    }

    // 회원가입
    @PostMapping(value = "/users", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> createUser(
            @Validated(UserRequest.addGroup.class) @RequestBody UserRequest userRequest) {
        return ResponseEntity.ok(
                CommonResponse.<Long>builder()
                        .successOrNot(CommonConstant.YES_FLAG)
                        .statusCode(CommonStatus.SUCCESS)
                        .data(userService.addUser(userRequest))
                        .build());
    }

    // 유저 정보
    @GetMapping(value = "/users",
            consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> userInfo() {
        return ResponseEntity.ok(
                CommonResponse.<UserInfoResponse>builder()
                        .successOrNot(CommonConstant.YES_FLAG)
                        .statusCode(CommonStatus.SUCCESS)
                        .data(userService.readUser())
                        .build());
    }

    // 유저 수정 (자체 로그인 유저만)
    @PutMapping(value = "/users",
            consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> updateUser(
            @Validated(UserRequest.updateGroup.class) @RequestBody UserRequest dto
    ) throws AccessDeniedException {
        return ResponseEntity.ok(
                CommonResponse.<Long>builder()
                        .successOrNot(CommonConstant.YES_FLAG)
                        .statusCode(CommonStatus.SUCCESS)
                        .data(userService.updateUserInfo(dto))
                        .build());
    }

    // 유저 제거 (자체/소셜)
    // TODO: 반환 Void 처리
    @DeleteMapping(value = "/users",
            consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> deleteUser(
            @Validated(UserRequest.deleteGroup.class) @RequestBody UserRequest dto
    ) throws AccessDeniedException {
        return ResponseEntity.ok(
                CommonResponse.<Void>builder()
                        .successOrNot(CommonConstant.YES_FLAG)
                        .statusCode(CommonStatus.SUCCESS)
                        .data(userService.deleteUser(dto))
                        .build());
    }
}
