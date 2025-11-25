package com.rally.ai_land.domain.chat.controller;

import com.rally.ai_land.common.constant.CommonConstant;
import com.rally.ai_land.common.constant.CommonStatus;
import com.rally.ai_land.common.dto.CommonResponse;
import com.rally.ai_land.domain.agent.dto.AgentCreateRequest;
import com.rally.ai_land.domain.auth.service.AuthService;
import com.rally.ai_land.domain.chat.dto.ChatRoomCreateRequest;
import com.rally.ai_land.domain.chat.dto.ChatRoomInfoResponse;
import com.rally.ai_land.domain.chat.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final ChatService chatService;
    private final AuthService authService;

    @PostMapping(value = "/chats/rooms",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> createChatRoom(@Valid @RequestBody ChatRoomCreateRequest chatRoomCreateRequest) {
        return ResponseEntity.ok(
                CommonResponse.<Long>builder()
                        .successOrNot(CommonConstant.YES_FLAG)
                        .statusCode(CommonStatus.SUCCESS)
                        .data(chatService.createChatRoom(authService.getCurrentUserId(), chatRoomCreateRequest))
                        .build());
    }

    @GetMapping(value = "/chats/rooms/{roomId}",
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getChatRoom(@PathVariable("roomId") Long roomId) {
        return ResponseEntity.ok(
                CommonResponse.<ChatRoomInfoResponse>builder()
                        .successOrNot(CommonConstant.YES_FLAG)
                        .statusCode(CommonStatus.SUCCESS)
                        .data(chatService.getChatRoomInfo(roomId))
                        .build());
    }

    @GetMapping(value = "/chats/rooms",
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getAllChatRooms() {
        return ResponseEntity.ok(
                CommonResponse.<List<ChatRoomInfoResponse>>builder()
                        .successOrNot(CommonConstant.YES_FLAG)
                        .statusCode(CommonStatus.SUCCESS)
                        .data(chatService.getAllChatRoomsInfo())
                        .build());
    }
}
