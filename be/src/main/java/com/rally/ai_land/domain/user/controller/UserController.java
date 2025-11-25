package com.rally.ai_land.domain.user.controller;

import com.rally.ai_land.common.constant.CommonConstant;
import com.rally.ai_land.common.constant.CommonStatus;
import com.rally.ai_land.common.dto.CommonResponse;
import com.rally.ai_land.domain.chat.dto.ChatRoomCreateRequest;
import com.rally.ai_land.domain.user.dto.UserCreateRequest;
import com.rally.ai_land.domain.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserService userService;


    @PostMapping(value = "/users",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> createUser(@Valid @RequestBody UserCreateRequest usercreateRequest) {
        return ResponseEntity.ok(
                CommonResponse.<Long>builder()
                        .successOrNot(CommonConstant.YES_FLAG)
                        .statusCode(CommonStatus.SUCCESS)
                        .data(userService.createUser(usercreateRequest))
                        .build());
    }


}
