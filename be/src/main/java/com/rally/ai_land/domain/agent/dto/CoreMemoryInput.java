package com.rally.ai_land.domain.agent.dto;

import lombok.Builder;
import lombok.Data;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.PromptTemplate;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class CoreMemoryInput {

    private final String agentName;
    private final String coreMemory;
    private final List<String> currentMessageList;

    // TODO: 이전의 CoreMemory 를 보여줘야 하는지
    public Prompt transformToPrompt() {
        StringBuilder currentMessageBuilder = new StringBuilder();
        int listSize = currentMessageList.size();
        for (int i = 0; i < listSize; i++) {
            currentMessageBuilder.append(currentMessageList.get(i)).append('\n');
        }

        Map<String, Object> params = Map.of(
                "agentName", agentName,
                "coreMemory", coreMemory != null ? coreMemory : "",
                "currentMessageList", currentMessageList != null && !currentMessageList.isEmpty()
                        ? currentMessageBuilder.toString()
                        : "현재 대화 없음"
        );

        PromptTemplate promptTemplate = new PromptTemplate("""
            - 당신은 {agentName}의 핵심 기억을 만드는 에이전트입니다.
            - 현재의 대화를 바탕으로 {agentName}의 핵심 기억을 만들어주세요.
            - 핵심 기억이란 앞으로 해당 사람이 계속 기억할만한 매우매우 가치있고 중요한 부분입니다.
            - 만약 핵심 기억으로 가져갈 만한 내용이 없다면 isImportant(true/false)에 false를 넣어주세요.
            - JSON 형식 -> "isImportant": true/false, "memories": 핵심 기억 내용
            
            - 현재 대화 목록
            {currentMessageList}
            """);
        return promptTemplate.create(params);
    }
}
