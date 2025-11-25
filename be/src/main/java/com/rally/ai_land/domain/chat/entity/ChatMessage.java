package com.rally.ai_land.domain.chat.entity;

import com.rally.ai_land.common.entity.BaseEntity;
import com.rally.ai_land.domain.chat.dto.ChatMessageType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "chatMessages")
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Getter
public class ChatMessage extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "roomId")
    private Long roomId;

    @Column(name = "senderId")
    private Long senderId;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Column(name = "chatMessageType")
    private ChatMessageType chatMessageType;
}
