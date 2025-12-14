package com.rally.ai_land.domain.player.service;

import com.rally.ai_land.domain.player.dto.PlayerInfo;
import com.rally.ai_land.domain.player.dto.PlayerPosition;
import com.rally.ai_land.domain.user.dto.PlayerSession;
import com.rally.ai_land.domain.user.entity.User;
import com.rally.ai_land.domain.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.type.descriptor.java.ObjectJavaType;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.RedisOperations;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.SessionCallback;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Component
@RequiredArgsConstructor
@Slf4j
public class StateManagerService {

    private final RedisTemplate<String, String> redisTemplate;
    private final UserRepository userRepository;

    private static final long PLAYER_INFO_TTL = 30L;
    private static final long SESSION_TTL = 2L;

    private static final String FIELD_X = "x";
    private static final String FIELD_Y = "y";
    private static final String FIELD_D = "d";
    private static final String FIELD_NAME = "name";
    private static final String FIELD_MAP_ID = "mapId";
    private static final String FIELD_PLAYER_ID = "playerId";

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
    // TODO: 삭제 예정 (성능 테스트 후)
    public List<PlayerInfo> getPlayerMapOnline(Long mapId) {
        // 요청 1: 온라인 플레이어 ID 목록 조회 (Set)
        List<String> onlinePlayerIdList = getOnlinePlayerIdList(mapId);
        if (onlinePlayerIdList == null || onlinePlayerIdList.isEmpty())
            return new ArrayList<>();

        // 요청 2: player:{playerId} 키로 플레이어 정보 조회
        List<PlayerInfo> playerInfoList = new ArrayList<>();

        for (String playerId : onlinePlayerIdList) {
            String playerKey = "player:" + playerId + ":info";
            Map<Object, Object> playerData = redisTemplate.opsForHash().entries(playerKey);

            // 플레이어 정보가 존재하는 경우에만 추가
            if (!playerData.isEmpty()) {
                playerInfoList.add(PlayerInfo.builder()
                        .playerId(Long.valueOf(playerId))
                        .name(String.valueOf(playerData.get(FIELD_NAME)))
                        .build());
            }
        }
        return playerInfoList;
    }

    // [플레이어 맵 온라인] 맵 온라인 플레이어 정보 제공: Pipelining 기법
    public List<PlayerInfo> getPlayerMapOnlineByPipelining(Long mapId) {
        // 요청 1: 온라인 플레이어 ID 목록 조회 (Set)
        List<String> onlinePlayerIdList = getOnlinePlayerIdList(mapId);
        if (onlinePlayerIdList == null || onlinePlayerIdList.isEmpty()) {
            return new ArrayList<>();
        }

        // 요청 2: 온라인 플레이어 Info 조회 (Hash) -> pipeline 적용
        List<Object> results = redisTemplate.executePipelined(new SessionCallback<Object>() {
            @Override
            public <K, V> Object execute(RedisOperations<K, V> operations) throws DataAccessException {
                // 제네릭 명시: <String, String>
                @SuppressWarnings("unchecked")
                RedisOperations<String, String> stringOps = (RedisOperations<String, String>) operations;

                for (String playerId : onlinePlayerIdList) {
                    String playerKey = "player:" + playerId + ":info";
                    stringOps.opsForHash().entries(playerKey);
                }
                return null;
            }
        });

        // 결과 처리
        List<PlayerInfo> playerInfoList = new ArrayList<>();
        int size = results.size();
        for (int i = 0; i < size; i++) {
            @SuppressWarnings("unchecked")
            Map<String, String> data = (Map<String, String>) results.get(i);

            if (data == null || data.isEmpty()) continue;

            if (data.get(FIELD_NAME) == null) continue;

            try {
                playerInfoList.add(PlayerInfo.builder()
                        .playerId(Long.valueOf(onlinePlayerIdList.get(i)))
                        .name(data.get(FIELD_NAME))
                        .build());
            } catch (NumberFormatException e) {
                log.error("Invalid position data format for player ID: {}, Data: {}", onlinePlayerIdList.get(i), data);
            }
        }
        return playerInfoList;
    }

    private List<String> getOnlinePlayerIdList(Long mapId) {
        String key = "map:" + mapId + ":players";
        Set<String> onlinePlayerIdSet = redisTemplate.opsForSet().members(key);

        // null 체크
        if (onlinePlayerIdSet == null || onlinePlayerIdSet.isEmpty()) {
            return new ArrayList<>();
        }

        // ist 로 변환
        return new ArrayList<>(onlinePlayerIdSet);
    }

    // [플레이어 정보] 플레이어 정보 추가: TTL 로 존재 가능
    public void addPlayerInfo(Long mapId, Long playerId) {
        String key = "player:" + playerId + ":info";

        // 데이터 있는 경우: TTL 만 증가
        Boolean isExists = redisTemplate.expire(key, PLAYER_INFO_TTL, TimeUnit.MINUTES);

        if (isExists) return;

        // 데이터 없는 경우
        User user = userRepository.findById(playerId)
                .orElseThrow(() -> new EntityNotFoundException("User Not Found with ID: " + playerId));

        Map<String, String> playerInfo = new HashMap<>();
        playerInfo.put(FIELD_MAP_ID, String.valueOf(mapId));
        playerInfo.put(FIELD_NAME, user.getNickname()); // Username 아님

        redisTemplate.opsForHash().putAll(key, playerInfo);
        redisTemplate.expire(key, PLAYER_INFO_TTL, TimeUnit.MINUTES);
    }

    // [플레이어 정보] 플레이어 정보 제거: TTL 관리
     public void removePlayerInfo(Long playerId) {
         String key = "player:" + playerId + ":info";
         redisTemplate.delete(key);
     }

    // [플레이어 포지션] 플레이어 포지션 추가 및 초기화: Hash 자료구조는 덮어써짐 -> putIfAbsent(): Insert Only
    // TODO: 좌표 숫자 형식 최적화: 다른 자료구조 or 소수점 줄이기(ex. 2자리) -> 우선 2자리
    public void addOrInitializePlayerPosition(Long playerId) {
        Map<String, Object> playerPosition = new HashMap<>();
        // TODO: 맵 별로 메타데이터를 만들어서 초기 스폰 장소 알고 있어야 함 + 프론트 하드코딩 말고 일관되게 해야 함
        playerPosition.put(FIELD_X, PlayerService.MAP_INIT_X); // 맵 중앙
        playerPosition.put(FIELD_Y, PlayerService.MAP_INIT_Y); // 맵 중앙
        playerPosition.put(FIELD_D, PlayerService.MAP_INIT_D); // direction(상하좌우): '하'로 초기화

        String key = "player:" + playerId + ":position";
        redisTemplate.opsForHash().putAll(key, playerPosition);
        redisTemplate.expire(key, PLAYER_INFO_TTL, TimeUnit.MINUTES);
    }

    // [플레이어 포지션] 플레이어 포지션 업데이트
    // TODO: 좌표 숫자 형식 최적화: 다른 자료구조 or 소수점 줄이기(ex. 2자리) -> 프론트에서 하는게 성능 유리
    // TODO: 최적화 1) 쓰기(Write-Back): 서버 메모리에만 갱신하다가 1초에 한 번만 Redis 에 저장.
    // TODO: 최적화 2) 변화 감지: 이전 위치와 비교해서 차이가 클 때만 Redis 저장.
    // TODO: 웹소켓에서 어차피 데이터를 제공하기 때문에 Redis 에서 무리할 필요는 없음
    public void updatePlayerPosition(Long playerId, double x, double y, short d) {
        Map<String, String> playerPosition = new HashMap<>();
        playerPosition.put(FIELD_X, String.valueOf(x));
        playerPosition.put(FIELD_Y, String.valueOf(y));
        playerPosition.put(FIELD_D, String.valueOf(d));

        String key = "player:" + playerId + ":position";
        redisTemplate.opsForHash().putAll(key, playerPosition);
        redisTemplate.expire(key, PLAYER_INFO_TTL, TimeUnit.MINUTES);
    }

    // [플레이어 포지션] 플레이어 포지션 제거: TTL 관리
     public void removePlayerPosition(Long playerId) {
         String key = "player:" + playerId + ":position";
         redisTemplate.delete(key);
     }

    // [플레이어 포지션] 플레이어 포지션 전체 조회
    public List<PlayerPosition> getAllPlayerPositions(Long mapId) {
        List<String> onlinePlayerIdList = getOnlinePlayerIdList(mapId);
        if (onlinePlayerIdList.isEmpty()) {
            return new ArrayList<>();
        }

        // SessionCallback 으로 Pipeline 실행
        List<Object> results = redisTemplate.executePipelined(new SessionCallback<Object>() {
            @Override
            public <K, V> Object execute(RedisOperations<K, V> operations) throws DataAccessException {
                @SuppressWarnings("unchecked")
                RedisOperations<String, String> stringOps = (RedisOperations<String, String>) operations;

                for (String playerId : onlinePlayerIdList) {
                    String playerKey = "player:" + playerId + ":position";
                    stringOps.opsForHash().entries(playerKey);
                }
                return null;
            }
        });

        // 결과 반환
        List<PlayerPosition> playerPositionList = new ArrayList<>();
        int size = results.size();
        for (int i = 0; i < size; i++) {
            @SuppressWarnings("unchecked")
            Map<String, String> data = (Map<String, String>) results.get(i);

            if (data == null || data.isEmpty()) {
                continue;
            }

            if (data.get(FIELD_X) == null || data.get(FIELD_Y) == null || data.get(FIELD_D) == null) {
                continue;
            }

            try {
                playerPositionList.add(PlayerPosition.builder()
                        .playerId(Long.valueOf(onlinePlayerIdList.get(i)))
                        .x(Double.parseDouble(data.get(FIELD_X))) // xyd 는 파싱에 취약: "", null, undefined, overflow
                        .y(Double.parseDouble(data.get(FIELD_Y)))
                        .d(Short.parseShort(data.get(FIELD_D)))
                        .build());
            } catch (NumberFormatException e) {
                log.error("Invalid position data format for player ID: {}, Data: {}", onlinePlayerIdList.get(i), data);
            }
        }
        return playerPositionList;
    }

    // [세션] 세션 저장
    public void setSession(String sessionId, Long mapId, Long playerId) {
        Map<String, Object> playerSession = new HashMap<>();
        playerSession.put(FIELD_MAP_ID, String.valueOf(mapId));
        playerSession.put(FIELD_PLAYER_ID, String.valueOf(playerId));

        String key = "session:" + sessionId;
        redisTemplate.opsForHash().putAll(key, playerSession);
        redisTemplate.expire(key, SESSION_TTL, TimeUnit.HOURS); // 세션 TTL 추가
    }

    // [세션] 세션 조회
    public PlayerSession getSession(String sessionId) {
        String key = "session:" + sessionId;

        Map<Object, Object> sessionData = redisTemplate.opsForHash().entries(key);
        log.info("sessionData: {}", sessionData);

        if (sessionData.isEmpty()) return null; // 세션 만료 혹은 유효하지 않은 세션으로 간주

        if (sessionData.get(FIELD_MAP_ID) == null || sessionData.get(FIELD_PLAYER_ID) == null) return null;

        try {
            return PlayerSession.builder()
                    .mapId(Long.valueOf((String) sessionData.get(FIELD_MAP_ID)))
                    .playerId(Long.valueOf((String) sessionData.get(FIELD_PLAYER_ID)))
                    .build();
        } catch (NumberFormatException e) {
            log.error("Invalid session data format. sessionId: {}", sessionId);
            return null;
        }
    }

    public void removeSession(String sessionId) {
        String key = "session:" + sessionId;
        redisTemplate.delete(key);
    }
}