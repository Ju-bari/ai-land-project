package com.rally.ai_land.domain.agent.entity;

import com.rally.ai_land.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "agents")
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Getter
public class Agent extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "personality", columnDefinition = "TEXT")
    private String personality;

    @Column(name = "core_memory", columnDefinition = "TEXT")
    private String coreMemory;

}
