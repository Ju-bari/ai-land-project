package com.rally.ai_land.domain.player.service;

import com.rally.ai_land.domain.player.dto.PlayerSession;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SessionManagerService {

    private Map<String, PlayerSession> sessions = new ConcurrentHashMap<>();

    public void addPlayer(String sessionId, Long userId, Long mapId) {
        sessions.put(sessionId,
                PlayerSession.builder()
                        .userId(userId)
                        .mapId(mapId)
                        .build());
    }

    public PlayerSession removeSession(String sessionId) {
        return sessions.remove(sessionId);
    }

    public PlayerSession getSession(String sessionId) {
        return sessions.get(sessionId);
    }

}
