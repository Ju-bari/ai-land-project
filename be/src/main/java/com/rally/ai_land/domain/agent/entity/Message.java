package com.rally.ai_land.domain.agent.entity;

import com.rally.ai_land.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "messages")
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Getter
public class Message extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    private Long conversationId;

    private Long agentId;

    private String agentName;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;
}
