package com.rally.ai_land.domain.player.service;

import com.rally.ai_land.domain.player.dto.PlayerInfo;
import com.rally.ai_land.domain.player.dto.PlayerPosition;
import com.rally.ai_land.domain.user.dto.PlayerSession;
import com.rally.ai_land.domain.user.entity.User;
import com.rally.ai_land.domain.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.SetOperations;

import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("StateManagerService 단위 테스트")
class StateManagerServiceTest {

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SetOperations<String, Object> setOperations;

    @Mock
    private HashOperations<String, Object, Object> hashOperations;

    @InjectMocks
    private StateManagerService stateManagerService;

    private static final Long MAP_ID = 1L;
    private static final Long PLAYER_ID = 100L;
    private static final String SESSION_ID = "test-session-123";

    @Nested
    @DisplayName("registerPlayerMapOnline() 테스트")
    class RegisterPlayerMapOnlineTest {

        @Test
        @DisplayName("플레이어를 맵 온라인 Set에 등록해야 한다")
        void shouldRegisterPlayerToMapOnlineSet() {
            // given
            when(redisTemplate.opsForSet()).thenReturn(setOperations);

            // when
            stateManagerService.registerPlayerMapOnline(MAP_ID, PLAYER_ID);

            // then
            verify(setOperations).add("map:1:players", String.valueOf(PLAYER_ID));
        }
    }

    @Nested
    @DisplayName("removePlayerMapOnline() 테스트")
    class RemovePlayerMapOnlineTest {

        @Test
        @DisplayName("플레이어를 맵 온라인 Set에서 제거해야 한다")
        void shouldRemovePlayerFromMapOnlineSet() {
            // given
            when(redisTemplate.opsForSet()).thenReturn(setOperations);

            // when
            stateManagerService.removePlayerMapOnline(MAP_ID, PLAYER_ID);

            // then
            verify(setOperations).remove("map:1:players", String.valueOf(PLAYER_ID));
        }
    }

    @Nested
    @DisplayName("getPlayerMapOnline() 테스트")
    class GetPlayerMapOnlineTest {

        @Test
        @DisplayName("온라인 플레이어 목록이 비어있으면 빈 리스트를 반환해야 한다")
        void shouldReturnEmptyListWhenNoOnlinePlayers() {
            // given
            when(redisTemplate.opsForSet()).thenReturn(setOperations);
            when(setOperations.members("map:1:players")).thenReturn(Collections.emptySet());

            // when
            List<PlayerInfo> result = stateManagerService.getPlayerMapOnline(MAP_ID);

            // then
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("온라인 플레이어 목록이 null이면 빈 리스트를 반환해야 한다")
        void shouldReturnEmptyListWhenOnlinePlayersIsNull() {
            // given
            when(redisTemplate.opsForSet()).thenReturn(setOperations);
            when(setOperations.members("map:1:players")).thenReturn(null);

            // when
            List<PlayerInfo> result = stateManagerService.getPlayerMapOnline(MAP_ID);

            // then
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("온라인 플레이어 정보를 조회해야 한다")
        void shouldReturnPlayerInfoList() {
            // given
            Set<Object> onlinePlayers = new HashSet<>();
            onlinePlayers.add("100");
            onlinePlayers.add("200");

            Map<Object, Object> playerData1 = new HashMap<>();
            playerData1.put("name", "Player1");

            Map<Object, Object> playerData2 = new HashMap<>();
            playerData2.put("name", "Player2");

            when(redisTemplate.opsForSet()).thenReturn(setOperations);
            when(setOperations.members("map:1:players")).thenReturn(onlinePlayers);
            when(redisTemplate.opsForHash()).thenReturn(hashOperations);
            when(hashOperations.entries("player:100:info")).thenReturn(playerData1);
            when(hashOperations.entries("player:200:info")).thenReturn(playerData2);

            // when
            List<PlayerInfo> result = stateManagerService.getPlayerMapOnline(MAP_ID);

            // then
            assertThat(result).hasSize(2);
            assertThat(result).extracting(PlayerInfo::getName)
                    .containsExactlyInAnyOrder("Player1", "Player2");
        }

        @Test
        @DisplayName("플레이어 정보가 없는 경우 해당 플레이어는 제외해야 한다")
        void shouldExcludePlayerWithNoInfo() {
            // given
            Set<Object> onlinePlayers = new HashSet<>();
            onlinePlayers.add("100");

            when(redisTemplate.opsForSet()).thenReturn(setOperations);
            when(setOperations.members("map:1:players")).thenReturn(onlinePlayers);
            when(redisTemplate.opsForHash()).thenReturn(hashOperations);
            when(hashOperations.entries("player:100:info")).thenReturn(Collections.emptyMap());

            // when
            List<PlayerInfo> result = stateManagerService.getPlayerMapOnline(MAP_ID);

            // then
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("addPlayerInfo() 테스트")
    class AddPlayerInfoTest {

        @Test
        @DisplayName("이미 키가 존재하면 아무것도 하지 않아야 한다")
        void shouldDoNothingWhenKeyExists() {
            // given
            when(redisTemplate.hasKey("player:100:info")).thenReturn(true);

            // when
            stateManagerService.addPlayerInfo(MAP_ID, PLAYER_ID);

            // then
            verify(userRepository, never()).findById(any());
            verify(redisTemplate, never()).opsForHash();
        }

        @Test
        @DisplayName("키가 없으면 사용자 정보를 조회하여 저장해야 한다")
        void shouldSavePlayerInfoWhenKeyNotExists() {
            // given
            User mockUser = User.builder()
                    .id(PLAYER_ID)
                    .username("testuser")
                    .nickname("TestNickname")
                    .password("password")
                    .isLock(false)
                    .isSocial(false)
                    .build();

            when(redisTemplate.hasKey("player:100:info")).thenReturn(false);
            when(userRepository.findById(PLAYER_ID)).thenReturn(Optional.of(mockUser));
            when(redisTemplate.opsForHash()).thenReturn(hashOperations);

            // when
            stateManagerService.addPlayerInfo(MAP_ID, PLAYER_ID);

            // then
            @SuppressWarnings("unchecked")
            ArgumentCaptor<Map<String, Object>> mapCaptor = ArgumentCaptor.forClass(Map.class);
            verify(hashOperations).putAll(eq("player:100:info"), mapCaptor.capture());

            Map<String, Object> capturedMap = mapCaptor.getValue();
            assertThat(capturedMap).containsEntry("mapId", MAP_ID);
            assertThat(capturedMap).containsEntry("name", "TestNickname");
        }

        @Test
        @DisplayName("사용자가 존재하지 않으면 EntityNotFoundException을 던져야 한다")
        void shouldThrowExceptionWhenUserNotFound() {
            // given
            when(redisTemplate.hasKey("player:100:info")).thenReturn(false);
            when(userRepository.findById(PLAYER_ID)).thenReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() -> stateManagerService.addPlayerInfo(MAP_ID, PLAYER_ID))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("User Not Found with ID: 100");
        }
    }

    @Nested
    @DisplayName("addOrInitializePlayerPosition() 테스트")
    class AddOrInitializePlayerPositionTest {

        @Test
        @DisplayName("플레이어 위치를 초기값으로 설정해야 한다")
        void shouldInitializePlayerPosition() {
            // given
            when(redisTemplate.opsForHash()).thenReturn(hashOperations);

            // when
            stateManagerService.addOrInitializePlayerPosition(PLAYER_ID);

            // then
            @SuppressWarnings("unchecked")
            ArgumentCaptor<Map<String, Object>> mapCaptor = ArgumentCaptor.forClass(Map.class);
            verify(hashOperations).putAll(eq("player:100:position"), mapCaptor.capture());

            Map<String, Object> capturedMap = mapCaptor.getValue();
            assertThat(capturedMap).containsEntry("x", PlayerService.MAP_INIT_X);
            assertThat(capturedMap).containsEntry("y", PlayerService.MAP_INIT_Y);
            assertThat(capturedMap).containsEntry("d", PlayerService.MAP_INIT_D);
        }
    }

    @Nested
    @DisplayName("updatePlayerPosition() 테스트")
    class UpdatePlayerPositionTest {

        @Test
        @DisplayName("플레이어 위치를 업데이트해야 한다")
        void shouldUpdatePlayerPosition() {
            // given
            double x = 150.75;
            double y = 250.50;
            short dir = 3;

            when(redisTemplate.opsForHash()).thenReturn(hashOperations);

            // when
            stateManagerService.updatePlayerPosition(PLAYER_ID, x, y, dir);

            // then
            @SuppressWarnings("unchecked")
            ArgumentCaptor<Map<String, Object>> mapCaptor = ArgumentCaptor.forClass(Map.class);
            verify(hashOperations).putAll(eq("player:100:position"), mapCaptor.capture());

            Map<String, Object> capturedMap = mapCaptor.getValue();
            assertThat(capturedMap).containsEntry("x", "150.75");
            assertThat(capturedMap).containsEntry("y", "250.50");
            assertThat(capturedMap).containsEntry("d", dir);
        }
    }

    @Nested
    @DisplayName("setSession() 테스트")
    class SetSessionTest {

        @Test
        @DisplayName("세션 정보를 저장해야 한다")
        void shouldSaveSessionInfo() {
            // given
            when(redisTemplate.opsForHash()).thenReturn(hashOperations);

            // when
            stateManagerService.setSession(SESSION_ID, MAP_ID, PLAYER_ID);

            // then
            @SuppressWarnings("unchecked")
            ArgumentCaptor<Map<String, Object>> mapCaptor = ArgumentCaptor.forClass(Map.class);
            verify(hashOperations).putAll(eq("session:test-session-123"), mapCaptor.capture());

            Map<String, Object> capturedMap = mapCaptor.getValue();
            assertThat(capturedMap).containsEntry("mapId", MAP_ID);
            assertThat(capturedMap).containsEntry("playerId", PLAYER_ID);
        }
    }

    @Nested
    @DisplayName("getSession() 테스트")
    class GetSessionTest {

        @Test
        @DisplayName("세션 정보를 조회해야 한다")
        void shouldGetSessionInfo() {
            // given
            Map<Object, Object> sessionData = new HashMap<>();
            sessionData.put("mapId", "1");
            sessionData.put("playerId", "100");

            when(redisTemplate.opsForHash()).thenReturn(hashOperations);
            when(hashOperations.entries("session:test-session-123")).thenReturn(sessionData);

            // when
            PlayerSession result = stateManagerService.getSession(SESSION_ID);

            // then
            assertThat(result.getMapId()).isEqualTo(1L);
            assertThat(result.getPlayerId()).isEqualTo(100L);
        }
    }

    @Nested
    @DisplayName("removeSession() 테스트")
    class RemoveSessionTest {

        @Test
        @DisplayName("세션 정보를 삭제해야 한다")
        void shouldRemoveSessionInfo() {
            // given
            when(redisTemplate.opsForHash()).thenReturn(hashOperations);

            // when
            stateManagerService.removeSession(SESSION_ID);

            // then
            verify(hashOperations).delete("session:test-session-123");
        }
    }

    @Nested
    @DisplayName("getAllPlayerPositions() 테스트")
    class GetAllPlayerPositionsTest {

        @Test
        @DisplayName("온라인 플레이어가 없으면 빈 리스트를 반환해야 한다")
        void shouldReturnEmptyListWhenNoOnlinePlayers() {
            // given
            when(redisTemplate.opsForSet()).thenReturn(setOperations);
            when(setOperations.members("map:1:players")).thenReturn(Collections.emptySet());

            // when
            List<PlayerPosition> result = stateManagerService.getAllPlayerPositions(MAP_ID);

            // then
            assertThat(result).isEmpty();
        }
    }
}
