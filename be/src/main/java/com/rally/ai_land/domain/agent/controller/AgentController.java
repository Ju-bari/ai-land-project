package com.rally.ai_land.domain.agent.controller;

import com.rally.ai_land.common.constant.CommonConstant;
import com.rally.ai_land.common.constant.CommonStatus;
import com.rally.ai_land.common.dto.CommonResponse;
import com.rally.ai_land.domain.agent.dto.*;
import com.rally.ai_land.domain.agent.service.AgentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Slf4j
public class AgentController {

    private final AgentService agentService;


    @PostMapping(value = "/agents",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> createAgent(@Valid @RequestBody AgentCreateRequest agentCreateRequest) {
        return ResponseEntity.ok(
                CommonResponse.<Long>builder()
                        .successOrNot(CommonConstant.YES_FLAG)
                        .statusCode(CommonStatus.SUCCESS)
                        .data(agentService.createAgent(agentCreateRequest))
                        .build());
    }

    @PostMapping(value = "/agents/conversation",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> conversation(@Valid @RequestBody AgentConversationRequest agentConversationRequest) {
        return ResponseEntity.ok(
                CommonResponse.<AgentConversationResponse>builder()
                        .successOrNot(CommonConstant.YES_FLAG)
                        .statusCode(CommonStatus.SUCCESS)
                        .data(agentService.startConversation(agentConversationRequest))
                        .build());
    }
}
