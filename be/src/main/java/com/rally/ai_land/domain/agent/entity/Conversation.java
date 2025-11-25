package com.rally.ai_land.domain.agent.entity;

import com.rally.ai_land.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "conversations")
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Getter
public class Conversation extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "agent_id_b", nullable = false)
    private Long agentIdA;

//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "agent_id_b", nullable = false)
    private Long agentIdB;

    @Column(name = "summary", nullable = false, columnDefinition = "TEXT")
    private String summary;
}
