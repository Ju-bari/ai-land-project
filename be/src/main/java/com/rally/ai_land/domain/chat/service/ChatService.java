package com.rally.ai_land.domain.chat.service;

import com.rally.ai_land.domain.chat.dto.ChatMessageSendRequest;
import com.rally.ai_land.domain.chat.dto.ChatMessageSendResponse;
import com.rally.ai_land.domain.chat.dto.ChatRoomCreateRequest;
import com.rally.ai_land.domain.chat.dto.ChatRoomInfoResponse;
import com.rally.ai_land.domain.chat.entity.ChatMessage;
import com.rally.ai_land.domain.chat.entity.ChatRoom;
import com.rally.ai_land.domain.chat.repository.ChatMessageRepository;
import com.rally.ai_land.domain.chat.repository.ChatRoomRepository;
import com.rally.ai_land.domain.user.entity.User;
import com.rally.ai_land.domain.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final UserRepository userRepository;


    public Long createChatRoom(Long creatorId, ChatRoomCreateRequest chatRoomCreateRequest) {
        ChatRoom chatRoom = ChatRoom.builder()
                .name(chatRoomCreateRequest.getName())
                .creatorId(creatorId)
                .build();

        chatRoomRepository.save(chatRoom);
        return chatRoom.getId();
    }

    public ChatRoomInfoResponse getChatRoomInfo(Long chatRoomId) {
        ChatRoom chatRoom = chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> new EntityNotFoundException("Chat room not found"));
        User user = userRepository.findById(chatRoom.getCreatorId())
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        return ChatRoomInfoResponse.builder()
                .id(chatRoom.getId())
                .name(chatRoom.getName())
                .creatorId(chatRoom.getCreatorId())
                .creatorName(user.getUsername())
                .build();
    }

    // TODO: ChatRoom 의 Username 도 넣으려면 N+1 문제 조심
    public List<ChatRoomInfoResponse> getAllChatRoomsInfo() {
        List<ChatRoom> chatRoomList = chatRoomRepository.findAll();

        return chatRoomList.stream()
                .map(chatRoom -> {
                    return ChatRoomInfoResponse.builder()
                            .id(chatRoom.getId())
                            .name(chatRoom.getName())
                            .creatorId(chatRoom.getCreatorId())
                            .build();
                })
                .collect(Collectors.toList());
    }

    public ChatMessageSendResponse sendChatMessage(Long roomId, ChatMessageSendRequest chatMessageSendRequest) {
        ChatMessage chatMessage = ChatMessage.builder()
                .roomId(roomId)
                .chatMessageType(chatMessageSendRequest.getChatMessageType())
                .senderId(chatMessageSendRequest.getSenderId())
                .message(chatMessageSendRequest.getMessage())
                .build();
        chatMessageRepository.save(chatMessage);

        return ChatMessageSendResponse.from(chatMessage);
    }
}
