package com.rally.ai_land.domain.agent.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rally.ai_land.domain.agent.dto.*;
import com.rally.ai_land.domain.agent.entity.Agent;
import com.rally.ai_land.domain.agent.entity.Conversation;
import com.rally.ai_land.domain.agent.entity.Message;
import com.rally.ai_land.domain.agent.repository.AgentRepository;
import com.rally.ai_land.domain.agent.repository.ConversationRepository;
import com.rally.ai_land.domain.agent.repository.MessageRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.SimpleLoggerAdvisor;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.core.Ordered;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
@Slf4j
public class AgentService {

    private final AgentRepository agentRepository;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final ChatClient chatClient;
    private final ObjectMapper objectMapper;
    private final Random random = new Random();

    public static final int MAX_CONVERSATION_MESSAGE_LENGTH = 10;

    public AgentService(AgentRepository agentRepository,
                        ConversationRepository conversationRepository,
                        MessageRepository messageRepository,
                        RedisTemplate<String, String> redisTemplate,
                        ChatClient.Builder chatClientBuilder,
                        ObjectMapper objectMapper) {
        this.agentRepository = agentRepository;
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.redisTemplate = redisTemplate;
        this.chatClient = chatClientBuilder
                .defaultAdvisors(
                        new SimpleLoggerAdvisor(Ordered.LOWEST_PRECEDENCE-1))
                .build();
        this.objectMapper = objectMapper;
    }


    public Long createAgent(AgentCreateRequest agentCreateRequest) {
        Agent agent = Agent.builder()
                .name(agentCreateRequest.getName())
                .build();
        return agentRepository.save(agent).getId();
    }

    // TODO: TTL
    public AgentConversationResponse startConversation(AgentConversationRequest agentConversationRequest) {
        // 대화 키값 공간 만들기
        String lowerAgentId = String.valueOf(Math.min(agentConversationRequest.getAgentIdA(), agentConversationRequest.getAgentIdB()));
        String higherAgentId = String.valueOf(Math.max(agentConversationRequest.getAgentIdA(), agentConversationRequest.getAgentIdB()));
        String conversationId = "conversation:" + lowerAgentId + ":" + higherAgentId;

        try {

            // 1. 정보 가져오기 및 Redis 에 로드
            Long agentAId = agentConversationRequest.getAgentIdA();
            Long agentBId = agentConversationRequest.getAgentIdB();
            loadInfo(conversationId, agentAId, agentBId);
            loadInfo(conversationId, agentBId, agentAId);

            // 첫 대화 상대 고르기
            Long[] agentList = new Long[]{agentAId, agentBId};
            int agentOrder = determineFirstAgent(agentList);

            // 2. 대화하기
            int maxConversationMessage = MAX_CONVERSATION_MESSAGE_LENGTH;
            while (maxConversationMessage-- > 0) {
                if (maxConversationMessage == 0) {
                    sendMessage(conversationId, agentList[agentOrder], agentList[(agentOrder+1)%2], true);
                    log.info("{} 대화를 종료합니다.", conversationId);
                    break;
                }
                if(sendMessage(conversationId, agentList[agentOrder], agentList[(agentOrder+1)%2], false)) {
                    log.info("{} 대화를 종료합니다.", conversationId);
                    break;
                }

                // 대화 순서 바꾸기
                agentOrder = (agentOrder+1)%2;
            }

            // 3. 대화 끝내기
            // TODO: 비동기 처리
            endConversation(conversationId, agentAId, agentBId);

            // TODO: 프론트에 출력해줄 것 고민 -> 이후에는 실시간 형식으로 변경
            return AgentConversationResponse.builder()
                    .conversationId(conversationId)
                    .currentMessages(redisTemplate.opsForList().range(
                            conversationId + ":currentConversation", 0, -1)
                    ) // TODO: 형식 고민
                    .build();
        } finally {
            // TODO: 비동기 처리 -> redis는 unlink 지원
            cleanupConversation(conversationId);
        }
    }

//    @Async
    protected void cleanupConversation(String conversationId) {
        try {
            redisTemplate.delete(conversationId);
            redisTemplate.delete(conversationId + ":currentConversation");
            log.info("Conversation {} cleaned up asynchronously", conversationId);
        } catch (Exception e) {
            log.error("Failed to cleanup conversation {}", conversationId, e);
        }
    }

    private boolean sendMessage(String conversationId, Long senderAgentId, Long receiverAgentId, boolean doStop) {
        // Redis 에서 현재 대화 목록 가져오기 (conversationId)
        // 없는 첫 번째 경우 -> [] 반환
        List<String> currentMessageList = redisTemplate.opsForList()
                .range(conversationId + ":currentConversation", 0, -1);

        // Redis 에서 현재 대화에 필요한 정보 가져오기
        Agent senderAgent = agentRepository.findById(senderAgentId)
                .orElseThrow(() -> new RuntimeException("not agent found"));
        Agent receiverAgent = agentRepository.findById(receiverAgentId)
                .orElseThrow(() -> new RuntimeException("not agent found"));

        MessageInput messageInput = MessageInput.builder()
                .senderAgentName(senderAgent.getName())
                .senderAgentBasicInfo((String) redisTemplate.opsForHash().get(conversationId, "basicInfo:" + senderAgentId))
                .senderAgentCoreInfo((String) redisTemplate.opsForHash().get(conversationId, "coreInfo:" + senderAgentId))
                .receiverAgentName(receiverAgent.getName())
                .receiverAgentBasicInfo((String) redisTemplate.opsForHash().get(conversationId, "basicInfo:" + receiverAgentId))
                .conversationHistory((String) redisTemplate.opsForHash().get(conversationId, "pastConversation:" + senderAgentId + ":" + receiverAgentId))
                .currentMessageList(currentMessageList)
                .build();

        // 대화 생성
        // TODO: template 중앙 관리(.txt) 고려
        Prompt prompt = messageInput.transformToPrompt(doStop);
        MessageOutput messageOutput = chatClient.prompt(prompt)
                .call()
                .entity(MessageOutput.class);

        // 현재 대화 목록 Redis 에 추가
        String saveOutput = senderAgent.getName() + ": " + messageOutput.getMessage();
        redisTemplate.opsForList().rightPush(conversationId + ":currentConversation", saveOutput);

        // 대화 지속할지 검증 추가
        return "true".equalsIgnoreCase(String.valueOf(messageOutput.isDoStop()));
    }

    private void loadInfo(String conversationId, Long senderAgentId, Long receiverAgentId) {
        // TODO: 실제 정보 넣기
        Map<String, String> agentData = new HashMap<>();

        // "- 에이전트x의 기본 정보\n"
        String basicInfo = "이름:" + agentRepository.findById(senderAgentId)
                .map(Agent::getName)
                .orElseThrow(() -> new RuntimeException("not agent name found"));
        agentData.put("basicInfo:" + senderAgentId, basicInfo);

        // "- 에이전트x의 핵심 기억 정보\n"
        String coreInfo = agentRepository.findById(receiverAgentId)
                .map(Agent::getCoreMemory)
                .orElse("핵심 기억 정보 없음");
        agentData.put("coreInfo:" + senderAgentId, coreInfo);

        // "- 에이전트x와 에이전트y의 과거 대화\n"
        List<Conversation> pastConversationList = conversationRepository.findConversationListByAgentIds(senderAgentId, receiverAgentId);
        StringBuilder pastConversation = new StringBuilder();
        int pastConversationListCount = pastConversationList.size();

        if (pastConversationListCount > 0) {
            for (int i = 0; i < pastConversationListCount; i++) {
                pastConversation.append(pastConversationList.get(i).toString()).append("\n");
            }
        } else {
            pastConversation.append("과거 대화 없음").append("\n");
        }
        agentData.put("pastConversation:" + senderAgentId, pastConversation.toString());
        redisTemplate.opsForHash().putAll(conversationId, agentData);
    }

    // TODO: 첫 대화 발화자 결정 로직 고도화
    private int determineFirstAgent(Long[] agentList) {
        return random.nextInt(0, 2);
    }

    public void endConversation(String conversationId, Long agentIdA, Long agentIdB) {
        // 1. 대화 요약
        List<String> currentMessageList = redisTemplate.opsForList()
                .range(conversationId + ":currentConversation", 0, -1);
        ConversationSummaryInput conversationSummaryInput = ConversationSummaryInput.builder()
                .currentMessageList(currentMessageList)
                .build();
        Prompt messageSummaryPrompt = conversationSummaryInput.transformToPrompt();

        ConversationSummaryOutput conversationSummaryOutput = chatClient.prompt(messageSummaryPrompt)
                .call()
                .entity(ConversationSummaryOutput.class);

        Conversation newConversation = Conversation.builder()
                .agentIdA(agentIdA)
                .agentIdB(agentIdB)
                .summary(conversationSummaryOutput.getSummary())
                .build();
        conversationRepository.save(newConversation);

        // 2. 대화 저장
        Map<String, Long> agentNameTag = new HashMap<>();
        String agentNameA = agentRepository.findById(agentIdA).get().getName();
        String agentNameB = agentRepository.findById(agentIdB).get().getName();
        agentNameTag.put(agentNameA, agentIdA);
        agentNameTag.put(agentNameB, agentIdB);
        saveConversation(newConversation.getId(), currentMessageList, agentNameTag);

        // 3. 대화 핵심 기억 저장
        // TODO: 핵심 기억 필요성에 대한 검증 로직 강화 필요
        updateCoreMemory(agentIdA, currentMessageList);
        updateCoreMemory(agentIdB, currentMessageList);
    }

    private void saveConversation(Long conversationId, List<String> currentMessageList, Map<String, Long> agentNameTag) {
        // LLM 성능을 극대화하기 위해 'name:content' 구조를 Redis 로 저장하고, 이후 후속 작업은 천천히 해도 되니 여기서 파싱
        int currentMessageListSize = currentMessageList.size();
        List<Message> messageList = new ArrayList<>();
        for (int i = 0; i < currentMessageListSize; i++) {
            String currentMessage = currentMessageList.get(i);
            String agentName = currentMessage.split(":")[0];
            String message = currentMessage.split(":")[1];
            Message newMessage = Message.builder()
                    .conversationId(conversationId)
                    .agentId(agentNameTag.get(agentName)) // TODO: 성능 고민
                    .agentName(agentName)
                    .content(message)
                    .build();
            messageList.add(newMessage);
        }
        messageRepository.saveAll(messageList);
    }

    private void updateCoreMemory(Long agentId, List<String> currentMessageList) {
        Agent agent = agentRepository.findById(agentId)
                .orElseThrow(() -> new RuntimeException("Agent not found"));
        CoreMemoryInput coreMemoryInput = CoreMemoryInput.builder()
                .agentName(agent.getName())
                .coreMemory(agent.getCoreMemory())
                .currentMessageList(currentMessageList)
                .build();
        Prompt coreMemoryPrompt = coreMemoryInput.transformToPrompt();

        CoreMemoryOutput coreMemoryOutput = chatClient.prompt(coreMemoryPrompt)
                .call()
                .entity(CoreMemoryOutput.class);

        try {
            String oldACoreMemory = agent.getCoreMemory();
            String newCoreMemory = coreMemoryOutput.getMemories();

            List<Map<String, String>> memoryList = new ArrayList<>();

            if (oldACoreMemory != null && !oldACoreMemory.isEmpty()) {
                memoryList = objectMapper.readValue(oldACoreMemory,
                        new TypeReference<List<Map<String, String>>>() {});
            }

            Map<String, String> newCoreMemoryMap = new HashMap<>();
            newCoreMemoryMap.put("coreMemory", newCoreMemory);
            newCoreMemoryMap.put("timestamp", LocalDateTime.now().toString());
            memoryList.add(newCoreMemoryMap);

            // 핵심 기억은 시간 순으로 잊혀지는 특성
            int maxMemoryCount = 20;
            if (memoryList.size() > maxMemoryCount) {
                memoryList = memoryList.subList(memoryList.size() - maxMemoryCount, memoryList.size());
            }
            String updateCoreMemory = objectMapper.writeValueAsString(memoryList);
            agentRepository.updateCoreMemory(agent.getId(), updateCoreMemory);

        } catch (JsonProcessingException e) {
            log.error(e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }
}
