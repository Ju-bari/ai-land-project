package com.rally.ai_land.domain.player.service;

import com.rally.ai_land.domain.player.dto.PlayerInfo;
import com.rally.ai_land.domain.player.dto.PlayerPosition;
import com.rally.ai_land.domain.user.dto.PlayerSession;
import com.rally.ai_land.domain.user.entity.User;
import com.rally.ai_land.domain.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.*;

@Component
@RequiredArgsConstructor
public class StateManagerService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final UserRepository userRepository;

//    RedisSerializer keySerializer = redisTemplate.getStringSerializer();
//    RedisSerializer valueSerializer = redisTemplate.getValueSerializer();

    // TODO: TTL 고려
    // TODO: 유저, 맵 등 ID 타입 고려: Long or String -> Redis Config 에서 헬퍼 메서드 만들지 함께 고민
    // TODO: 동시성 문제 대비했나 (ex. 아이템 줍기)

    // [플레이어 맵 온라인] 맵 온라인 플레이어 등록
    public void registerPlayerMapOnline(Long mapId, Long playerId) {
        String key = "map:" + mapId + ":players";
        redisTemplate.opsForSet().add(key, String.valueOf(playerId));
    }

    // [플레이어 맵 온라인] 맵 온라인 플레이어 제거
    public void removePlayerMapOnline(Long mapId, Long playerId) {
        String key = "map:" + mapId + ":players";
        redisTemplate.opsForSet().remove(key, String.valueOf(playerId));
    }

    // [플레이어 맵 온라인] 맵 온라인 플레이어 정보 제공
    public List<PlayerInfo> getPlayerMapOnline(Long mapId) {
        // 요청 1: 온라인 플레이어 ID 목록 조회 (Set)
        List<String> onlinePlayerIdList = getOnlinePlayerIdList(mapId);
        if(onlinePlayerIdList == null || onlinePlayerIdList.isEmpty()) return new ArrayList<>();

        // 요청 2: player:{playerId} 키로 플레이어 정보 조회
        List<PlayerInfo> playerInfoList = new ArrayList<>();

        for (String playerId : onlinePlayerIdList) {
            String playerKey = "player:" + playerId + ":info";
            Map<Object, Object> playerData = redisTemplate.opsForHash().entries(playerKey);

            // 플레이어 정보가 존재하는 경우에만 추가
            if (!playerData.isEmpty()) {
                playerInfoList.add(PlayerInfo.builder()
                        .playerId(Long.valueOf(playerId))
                        .name(String.valueOf(playerData.get("name")))
                        .build());
            }
        }
        return playerInfoList;
    }

    private List<String> getOnlinePlayerIdList(Long mapId) {
        String key = "map:" + mapId + ":players";
        Set<Object> onlinePlayerIdSet = redisTemplate.opsForSet().members(key);

        // null 체크
        if (onlinePlayerIdSet == null || onlinePlayerIdSet.isEmpty()) {
            return new ArrayList<>();
        }

        // playerIdList 로 변환
        List<String> onlinePlayerIdList = new ArrayList<>();
        onlinePlayerIdSet.forEach(obj -> onlinePlayerIdList.add(String.valueOf(obj)));
        return onlinePlayerIdList;
    }

    // [플레이어 맵 온라인] 맵 온라인 플레이어 정보 제공: Pipelining 기법
    public List<PlayerInfo> getPlayerMapOnlineByPipelining(Long mapId) {
        // 요청 1: 온라인 플레이어 ID 목록 조회 (Set)
        List<String> onlinePlayerIdList = getOnlinePlayerIdList(mapId);
        if(onlinePlayerIdList == null || onlinePlayerIdList.isEmpty()) return new ArrayList<>();

        // 요청 2: 온라인 플레이어 Info 조회 (Hash) -> pipeline 적용
        List<Object> results = redisTemplate.executePipelined((RedisCallback<Object>) connection -> {
            for (String playerId : onlinePlayerIdList) {
                String playerKey = "player:" + playerId + ":info";
                connection.hashCommands().hGetAll(playerKey.getBytes());
            }
            return null;
        });

        // 결과 처리
        List<PlayerInfo> playerInfoList = new ArrayList<>();
        for (int i = 0; i < results.size(); i++) {
            // 변환 필요
            Map<byte[], byte[]> playerInfoBytes = (Map<byte[], byte[]>) results.get(i);

            // 리스트 담기
            if (playerInfoBytes != null && !playerInfoBytes.isEmpty()) {
                Map<String, String> playerInfoData = convertBytesToStringMap(playerInfoBytes);

                playerInfoList.add(PlayerInfo.builder()
                        .playerId(Long.valueOf(onlinePlayerIdList.get(i)))
                        .name(playerInfoData.get("name"))
                        .build());
            }
        }
        return playerInfoList;
    }

    private Map<String, String> convertBytesToStringMap(Map<byte[], byte[]> bytesMap) {
        Map<String, String> stringMap = new HashMap<>();
        bytesMap.forEach((key, value) -> {
            stringMap.put(
                    new String(key, StandardCharsets.UTF_8),
                    new String(value, StandardCharsets.UTF_8));
        });
        return stringMap;
    }

    // [플레이어 정보] 플레이어 정보 추가: TTL 로 존재 가능
    public void addPlayerInfo(Long mapId, Long playerId) {
        String key = "player:" + playerId + ":info";

        // 데이터 있는 경우: TTL 만 증가
        if (Boolean.TRUE.equals(redisTemplate.hasKey(key))) {
//            redisTemplate.expire(key, 30, TimeUnit.MINUTES);
            return;
        }

        // 데이터 없는 경우
        User user = userRepository.findById(playerId)
                .orElseThrow(() -> new EntityNotFoundException("User Not Found"));

        Map<String, Object> playerInfo = new HashMap<>();
        playerInfo.put("mapId", mapId);
        playerInfo.put("name", user.getUsername());

        redisTemplate.opsForHash().putAll(key, playerInfo);
    }

    // [플레이어 정보] 플레이어 정보 제거: TTL 관리
//    public void removePlayerInfo(Long playerId) {
//
//    }

    // [플레이어 포지션] 플레이어 포지션 추가 및 초기화: Hash 자료구조는 덮어써짐 -> putIfAbsent(): Insert Only
    // TODO: 좌표 숫자 형식 최적화: 다른 자료구조 or 소수점 줄이기(ex. 2자리)
    public void addOrInitializePlayerPosition(Long playerId) {
        Map<String, Object> playerPosition = new HashMap<>();
        playerPosition.put("x", 0);
        playerPosition.put("y", 0);
        playerPosition.put("d", 2); // direction(상하좌우): '하'로 초기화

        String key = "player:" + playerId + ":position";
        redisTemplate.opsForHash().putAll(key, playerPosition);
    }

    // [플레이어 포지션] 플레이어 포지션 업데이트
    // TODO: 좌표 숫자 형식 최적화: 다른 자료구조 or 소수점 줄이기(ex. 2자리) -> 프론트엔드 참고해야 함
    // TODO: 최적화 1) 쓰기(Write-Back): 서버 메모리에만 갱신하다가 1초에 한 번만 Redis 에 저장.
    // TODO: 최적화 2) 변화 감지: 이전 위치와 비교해서 차이가 클 때만 Redis 저장.
    // TODO: 웹소켓에서 어차피 데이터를 제공하기 때문에 Redis 에서 무리할 필요는 없음
    public void updatePlayerPosition(Long playerId, double x, double y, short dir) {
        Map<String, Object> playerPosition = new HashMap<>();
        playerPosition.put("x", String.format("%.2f", x));
        playerPosition.put("y", String.format("%.2f", y));
        playerPosition.put("d", dir); // direction(상하좌우): '하'로 초기화

        String key = "player:" + playerId + ":position";
        redisTemplate.opsForHash().putAll(key, playerPosition);
    }

    // [플레이어 포지션] 플레이어 포지션 제거: TTL 관리
//    public void removePlayerPosition(Long playerId) {
//
//    }

    // [플레이어 포지션] 플레이어 포지션 전체 조회
    public List<PlayerPosition> getAllPlayerPositions(Long mapId) {
        // 요청 1: 맵에 있는 온라인 유저들
        // TODO: <맵 온라인 플레이어 정보 제공> 단계에서 한 번 진행 -> 정합성 문제 발생할 수도
        List<String> onlinePlayerIdList = getOnlinePlayerIdList(mapId);
        if(onlinePlayerIdList == null || onlinePlayerIdList.isEmpty()) return new ArrayList<>();

        // 요청 2: 온라인 유저들 포지션
        List<Object> results = redisTemplate.executePipelined((RedisCallback<Object>) connection -> {
            for (String playerId : onlinePlayerIdList) {
                String playerKey = "player:" + playerId + ":position";
                connection.hashCommands().hGetAll(playerKey.getBytes());
            }
            return null;
        });

        // 결과 처리
        List<PlayerPosition> playerPositionList = new ArrayList<>();
        for (int i = 0; i < results.size(); i++) {
            // 변환 필요
            Map<byte[], byte[]> playerPositionBytes = (Map<byte[], byte[]>) results.get(i);

            // 리스트 담기
            if (playerPositionBytes != null && !playerPositionBytes.isEmpty()) {
                Map<String, String> playerPositionData = convertBytesToStringMap(playerPositionBytes);

                playerPositionList.add(PlayerPosition.builder()
                                .playerId(Long.valueOf(onlinePlayerIdList.get(i)))
                                .x(Double.parseDouble(playerPositionData.get("x")))
                                .y(Double.parseDouble(playerPositionData.get("y")))
                                .d(Short.parseShort(playerPositionData.get("d")))
                                .build());
            }
        }
        return playerPositionList;
    }

    // [세션] 세션 저장
    public void setSession(String sessionId, Long mapId, Long playerId) {
        Map<String, Object> playerSession = new HashMap<>();
        playerSession.put("mapId", mapId);
        playerSession.put("playerId", playerId);

        String key = "session:" + sessionId;
        redisTemplate.opsForHash().putAll(key, playerSession);
    }

    // [세션] 세션 조회
    // TODO: Redis Serializer 설정에 따라 Integer로 저장될 수도, String으로 저장될 수 있게 함
    // TODO: String -> Long 으로 하는 헬퍼 메서드 만들어야 할 수도 있음
    public PlayerSession getSession(String sessionId) {
        String key = "session:" + sessionId;
        Map<Object, Object> playerSessionObject = redisTemplate.opsForHash().entries(key);

        return PlayerSession.builder()
                .mapId(Long.parseLong(String.valueOf(playerSessionObject.get("mapId"))))
                .playerId(Long.parseLong(String.valueOf(playerSessionObject.get("playerId"))))
                .build();
    }

    public void removeSession(String sessionId) {
        String key = "session:" + sessionId;
        redisTemplate.opsForHash().delete(key);
    }
}