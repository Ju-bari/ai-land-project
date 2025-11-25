package com.rally.ai_land.domain.chat.repository;

import com.rally.ai_land.domain.chat.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.web.bind.annotation.RestController;

@RestController
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

}
