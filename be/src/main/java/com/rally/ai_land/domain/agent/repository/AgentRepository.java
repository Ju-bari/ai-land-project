package com.rally.ai_land.domain.agent.repository;

import com.rally.ai_land.domain.agent.entity.Agent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface AgentRepository extends JpaRepository<Agent, Long> {

    @Modifying
    @Transactional
    @Query("""
        UPDATE Agent a SET a.coreMemory = :coreMemory
        WHERE a.id = :agentId
    """)
    int updateCoreMemory(@Param("agentId") Long agentId, @Param("coreMemory") String coreMemory);
}
