package com.rally.ai_land.domain.agent.dto;

import com.rally.ai_land.domain.agent.service.AgentService;
import lombok.Builder;
import lombok.Data;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.PromptTemplate;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@Data
@Builder
public class MessageInput {

    private final String senderAgentName;
    private final String senderAgentBasicInfo;
    private final String senderAgentCoreInfo;
    private final String receiverAgentName;
    private final String receiverAgentBasicInfo;
    private final String conversationHistory;
    private final List<String> currentMessageList;

    private final int MAX_CONVERSATION_MESSAGE_LENGTH = AgentService.MAX_CONVERSATION_MESSAGE_LENGTH;

    public Prompt transformToPrompt(boolean doStop) {
//        StringBuilder prompt = new StringBuilder();
//        prompt.append("- 당신은 ").append(senderAgentBasicInfo).append("를 위한 대화 생성 에이전트입니다.").append("\n");
//        prompt.append("- 자신의 정보와 대화하는 사람의 정보를 조합해서 현재 대화의 맥락을 고려해서 대화를 생성하세요.").append("\n");
//        prompt.append("- ").append(senderAgentName).append("의 기본 정보").append("\n");
//        prompt.append(senderAgentBasicInfo).append("\n");
//        prompt.append("- ").append(senderAgentName).append("의 핵심 기억 정보").append("\n");
//        prompt.append(senderAgentCoreInfo).append("\n");
//        prompt.append("- ").append(receiverAgentName).append("의 기본 정보").append("\n");
//        prompt.append(receiverAgentBasicInfo).append("\n");
//        prompt.append("- ").append(senderAgentName).append("와 ").append(receiverAgentName).append("의 과거 대화").append("\n");
//        prompt.append(conversationHistory).append("\n");
//        prompt.append("- ").append("현재 대화 목록").append("\n");
//        prompt.append(currentMessageList).append("\n");
//        return prompt.toString();

        // 현재 대화가 20개 되면 마무리되도록 함
        // TODO: Object 가 Key 값인 것 주의
        // TODO: 우선 리스트로 프롬프트에 넣어보기
        // HashMap 은 Null 이 가능하지만, 이후 Null 처리의 문제로 인해 requireNonNullElse 를 쓰는게 좋을 듯
        Map<String, Object> params = Map.of(
                "senderName", Objects.requireNonNullElse(senderAgentName, ""),
                "senderBasicInfo", Objects.requireNonNullElse(senderAgentBasicInfo, ""),
                "senderCoreInfo", Objects.requireNonNullElse(senderAgentCoreInfo, ""),
                "receiverName", Objects.requireNonNullElse(receiverAgentName, ""),
                "receiverBasicInfo", Objects.requireNonNullElse(receiverAgentBasicInfo, ""),
                "conversationHistory", Objects.requireNonNullElse(conversationHistory, ""),
                "currentMessageList", currentMessageList != null && !currentMessageList.isEmpty()
                        ? currentMessageList
                        : "현재 대화 없음",
                "additionalInstruct", currentMessageList.size() >= MAX_CONVERSATION_MESSAGE_LENGTH || doStop
                        ? "대화가 오랫동안 지속되어서 이제 마무리하도록 하세요."
                        : ""
        );

        PromptTemplate promptTemplate = new PromptTemplate("""
            - 당신은 {senderName}를 위한 대화 생성 에이전트입니다.
            - 자신의 정보와 대화하는 사람의 정보를 조합해서 현재 대화의 맥락을 고려해서 대화 하나를 생성하세요.
            - 만들어진 대화 내용 한 개는 message 변수에 담아주세요
            - 그만 이야기해도 된다고 생각하면 doStop에 "true" 또는 "false"로 담아주세요
            
            - {senderName}의 기본 정보
            {senderBasicInfo}
            
            - {senderName}의 핵심 기억 정보
            {senderCoreInfo}
            
            - {receiverName}의 기본 정보
            {receiverBasicInfo}
            
            - {senderName}와 {receiverName}의 과거 대화
            {conversationHistory}
            
            - 현재 대화 목록
            {currentMessageList}
            {additionalInstruct}
            """);
        return promptTemplate.create(params);
    }
}
