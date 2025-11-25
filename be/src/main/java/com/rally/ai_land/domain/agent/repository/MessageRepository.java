package com.rally.ai_land.domain.agent.repository;

import com.rally.ai_land.domain.agent.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository

public interface MessageRepository extends JpaRepository<Message, Long> {
}
