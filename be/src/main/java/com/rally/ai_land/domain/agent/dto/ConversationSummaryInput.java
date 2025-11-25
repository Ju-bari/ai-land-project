package com.rally.ai_land.domain.agent.dto;

import lombok.Builder;
import lombok.Data;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.PromptTemplate;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class ConversationSummaryInput {

    private final List<String> currentMessageList;

    public Prompt transformToPrompt() {
        StringBuilder currentMessageBuilder = new StringBuilder();
        int listSize = currentMessageList.size();
        for (int i = 0; i < listSize; i++) {
            currentMessageBuilder.append(currentMessageList.get(i)).append('\n');
        }

        Map<String, Object> params = Map.of(
                "currentMessageList", currentMessageList != null && !currentMessageList.isEmpty()
                        ? currentMessageBuilder.toString()
                        : "현재 대화 없음"
        );

        PromptTemplate promptTemplate = new PromptTemplate("""
            - 당신은 대화 요약 에이전트입니다.
            - 현재의 대화를 대화 발화자를 고려하며 요약해주세요.
            - 간결하고 핵심있게 요약하세요.
            
            - 현재 대화 목록
            {currentMessageList}
            """);
        return promptTemplate.create(params);
    }
}
