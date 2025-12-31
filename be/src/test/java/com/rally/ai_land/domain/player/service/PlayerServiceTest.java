package com.rally.ai_land.domain.player.service;

import com.rally.ai_land.domain.player.dto.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PlayerService 단위 테스트")
class PlayerServiceTest {

    @Mock
    private StateManagerService stateManagerService;

    @Mock
    private SimpMessagingTemplate simpMessagingTemplate;

    @InjectMocks
    private PlayerService playerService;

    private static final String SESSION_ID = "test-session-123";
    private static final String USERNAME = "testUser";
    private static final Long MAP_ID = 1L;
    private static final Long PLAYER_ID = 100L;

    // Helper method to create PlayerJoinRequest
    private PlayerJoinRequest createPlayerJoinRequest(String type, Long playerId) {
        PlayerJoinRequest request = new PlayerJoinRequest();
        request.setType(type);
        request.setPlayerId(playerId);
        return request;
    }

    // Helper method to create PlayerLeaveRequest
    private PlayerLeaveRequest createPlayerLeaveRequest(String type, Long playerId) {
        PlayerLeaveRequest request = PlayerLeaveRequest.builder()
                .type(type)
                .playerId(playerId)
                .build();
        return request;
    }

    // Helper method to create PlayerPositionUpdateRequest
    private PlayerPositionUpdateRequest createPlayerPositionUpdateRequest(
            String type, Long playerId, double x, double y, short dir) {
        PlayerPositionUpdateRequest request = new PlayerPositionUpdateRequest();
        request.setType(type);
        request.setPlayerId(playerId);
        request.setX(x);
        request.setY(y);
        request.setDir(dir);
        return request;
    }

    @Nested
    @DisplayName("handlePlayerState() 메서드는")
    class HandlePlayerStateTest {

        @Test
        @DisplayName("P_JOIN 타입일 때 handlePlayerJoin()을 호출해야 한다")
        void shouldCallHandlePlayerJoinWhenTypeIsPJoin() {
            // given
            PlayerJoinRequest request = createPlayerJoinRequest("P_JOIN", PLAYER_ID);

            when(stateManagerService.getPlayersMapOnline(MAP_ID)).thenReturn(List.of());
            when(stateManagerService.getAllPlayerPositions(MAP_ID)).thenReturn(List.of());

            // when
            playerService.handlePlayerState(SESSION_ID, USERNAME, MAP_ID, request);

            // then
            verify(stateManagerService).setSession(SESSION_ID, MAP_ID, PLAYER_ID);
            verify(stateManagerService).registerPlayerMapOnline(MAP_ID, PLAYER_ID);
            verify(stateManagerService).addPlayerInfo(MAP_ID, PLAYER_ID);
            verify(stateManagerService).addOrInitializePlayerPosition(PLAYER_ID);
        }

        @Test
        @DisplayName("P_LEAVE 타입일 때 handlePlayerLeave()를 호출해야 한다")
        void shouldCallHandlePlayerLeaveWhenTypeIsPLeave() {
            // given
            PlayerLeaveRequest request = createPlayerLeaveRequest("P_LEAVE", PLAYER_ID);

            // when
            playerService.handlePlayerState(SESSION_ID, USERNAME, MAP_ID, request);

            // then
            verify(stateManagerService).removeSession(SESSION_ID);
            verify(stateManagerService).removePlayerMapOnline(MAP_ID, PLAYER_ID);
        }

        @Test
        @DisplayName("P_MOVE 타입일 때 handlePositionUpdate()를 호출해야 한다")
        void shouldCallHandlePositionUpdateWhenTypeIsPMove() {
            // given
            PlayerPositionUpdateRequest request = createPlayerPositionUpdateRequest(
                    "P_MOVE", PLAYER_ID, 100.5, 200.5, (short) 1);

            // when
            playerService.handlePlayerState(SESSION_ID, USERNAME, MAP_ID, request);

            // then
            verify(stateManagerService).updatePlayerPosition(PLAYER_ID, 100.5, 200.5, (short) 1);
        }

        @Test
        @DisplayName("알 수 없는 타입일 때 IllegalArgumentException을 던져야 한다")
        void shouldThrowExceptionWhenTypeIsUnknown() {
            // given
            PlayerJoinRequest request = createPlayerJoinRequest("UNKNOWN_TYPE", PLAYER_ID);

            // when & then
            assertThatThrownBy(() -> playerService.handlePlayerState(SESSION_ID, USERNAME, MAP_ID, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("알 수 없는 message type: UNKNOWN_TYPE");
        }
    }

    @Nested
    @DisplayName("handlePlayerJoin() (P_JOIN) 테스트")
    class HandlePlayerJoinTest {

        @Test
        @DisplayName("플레이어 상태를 올바르게 업데이트해야 한다")
        void shouldUpdatePlayerStateCorrectly() {
            // given
            PlayerJoinRequest request = createPlayerJoinRequest("P_JOIN", PLAYER_ID);

            when(stateManagerService.getPlayersMapOnline(MAP_ID)).thenReturn(List.of());
            when(stateManagerService.getAllPlayerPositions(MAP_ID)).thenReturn(List.of());

            // when
            playerService.handlePlayerState(SESSION_ID, USERNAME, MAP_ID, request);

            // then
            verify(stateManagerService).setSession(SESSION_ID, MAP_ID, PLAYER_ID);
            verify(stateManagerService).registerPlayerMapOnline(MAP_ID, PLAYER_ID);
            verify(stateManagerService).addPlayerInfo(MAP_ID, PLAYER_ID);
            verify(stateManagerService).addOrInitializePlayerPosition(PLAYER_ID);
        }

        @Test
        @DisplayName("브로드캐스트 메시지를 /topic/map/{mapId}로 전송해야 한다")
        void shouldSendBroadcastMessageToTopic() {
            // given
            PlayerJoinRequest request = createPlayerJoinRequest("P_JOIN", PLAYER_ID);

            when(stateManagerService.getPlayersMapOnline(MAP_ID)).thenReturn(List.of());
            when(stateManagerService.getAllPlayerPositions(MAP_ID)).thenReturn(List.of());

            // when
            playerService.handlePlayerState(SESSION_ID, USERNAME, MAP_ID, request);

            // then
            ArgumentCaptor<PlayerJoinResponse> responseCaptor = ArgumentCaptor.forClass(PlayerJoinResponse.class);
            verify(simpMessagingTemplate).convertAndSend(eq("/topic/map/" + MAP_ID), responseCaptor.capture());

            PlayerJoinResponse capturedResponse = responseCaptor.getValue();
            assertThat(capturedResponse.getType()).isEqualTo("P_JOIN");
            assertThat(capturedResponse.getPlayerId()).isEqualTo(PLAYER_ID);
            assertThat(capturedResponse.getPlayerPosition().getX()).isEqualTo(PlayerService.MAP_INIT_X);
            assertThat(capturedResponse.getPlayerPosition().getY()).isEqualTo(PlayerService.MAP_INIT_Y);
            assertThat(capturedResponse.getPlayerPosition().getD()).isEqualTo(PlayerService.MAP_INIT_D);
        }

        @Test
        @DisplayName("초기화 메시지를 /user/{username}/queue/map/{mapId}/init로 전송해야 한다")
        void shouldSendInitMessageToUser() {
            // given
            PlayerJoinRequest request = createPlayerJoinRequest("P_JOIN", PLAYER_ID);

            List<PlayerInfo> playerInfoList = List.of(
                    PlayerInfo.builder().playerId(PLAYER_ID).name("TestPlayer").build());
            List<PlayerPosition> playerPositionList = List.of(
                    PlayerPosition.builder()
                            .playerId(PLAYER_ID)
                            .x(PlayerService.MAP_INIT_X)
                            .y(PlayerService.MAP_INIT_Y)
                            .d(PlayerService.MAP_INIT_D)
                            .build());

            when(stateManagerService.getPlayersMapOnline(MAP_ID)).thenReturn(playerInfoList);
            when(stateManagerService.getAllPlayerPositions(MAP_ID)).thenReturn(playerPositionList);

            // when
            playerService.handlePlayerState(SESSION_ID, USERNAME, MAP_ID, request);

            // then
            ArgumentCaptor<PlayerInitResponse> responseCaptor = ArgumentCaptor.forClass(PlayerInitResponse.class);
            verify(simpMessagingTemplate).convertAndSendToUser(
                    eq(USERNAME),
                    eq("/queue/map/" + MAP_ID + "/init"),
                    responseCaptor.capture());

            PlayerInitResponse capturedResponse = responseCaptor.getValue();
            assertThat(capturedResponse.getType()).isEqualTo(ActionType.P_Init);
            assertThat(capturedResponse.getPlayerId()).isEqualTo(PLAYER_ID);
            assertThat(capturedResponse.getPlayerInfoList()).hasSize(1);
            assertThat(capturedResponse.getPlayerPositionList()).hasSize(1);
        }
    }

    @Nested
    @DisplayName("handlePlayerLeave() (P_LEAVE) 테스트")
    class HandlePlayerLeaveTest {

        @Test
        @DisplayName("세션과 플레이어 온라인 상태를 제거해야 한다")
        void shouldRemoveSessionAndPlayerOnlineStatus() {
            // given
            PlayerLeaveRequest request = PlayerLeaveRequest.builder()
                    .type("P_LEAVE")
                    .playerId(PLAYER_ID)
                    .build();

            // when
            playerService.handlePlayerLeave(SESSION_ID, MAP_ID, request);

            // then
            verify(stateManagerService).removeSession(SESSION_ID);
            verify(stateManagerService).removePlayerMapOnline(MAP_ID, PLAYER_ID);
        }

        @Test
        @DisplayName("퇴장 메시지를 /topic/map/{mapId}로 브로드캐스트해야 한다")
        void shouldBroadcastLeaveMessageToTopic() {
            // given
            PlayerLeaveRequest request = PlayerLeaveRequest.builder()
                    .type("P_LEAVE")
                    .playerId(PLAYER_ID)
                    .build();

            // when
            playerService.handlePlayerLeave(SESSION_ID, MAP_ID, request);

            // then
            ArgumentCaptor<PlayerLeaveResponse> responseCaptor = ArgumentCaptor.forClass(PlayerLeaveResponse.class);
            verify(simpMessagingTemplate).convertAndSend(eq("/topic/map/" + MAP_ID), responseCaptor.capture());

            PlayerLeaveResponse capturedResponse = responseCaptor.getValue();
            assertThat(capturedResponse.getType()).isEqualTo("P_LEAVE");
            assertThat(capturedResponse.getPlayerId()).isEqualTo(PLAYER_ID);
        }
    }

    @Nested
    @DisplayName("handlePositionUpdate() (P_MOVE) 테스트")
    class HandlePositionUpdateTest {

        @Test
        @DisplayName("플레이어 위치를 올바르게 업데이트해야 한다")
        void shouldUpdatePlayerPositionCorrectly() {
            // given
            double x = 150.75;
            double y = 250.50;
            short dir = 3;

            PlayerPositionUpdateRequest request = new PlayerPositionUpdateRequest();
            request.setType("P_MOVE");
            request.setPlayerId(PLAYER_ID);
            request.setX(x);
            request.setY(y);
            request.setDir(dir);

            // when
            playerService.handlePlayerState(SESSION_ID, USERNAME, MAP_ID, request);

            // then
            verify(stateManagerService).updatePlayerPosition(PLAYER_ID, x, y, dir);
        }

        @Test
        @DisplayName("위치 업데이트 메시지를 /topic/map/{mapId}로 브로드캐스트해야 한다")
        void shouldBroadcastPositionUpdateToTopic() {
            // given
            double x = 150.75;
            double y = 250.50;
            short dir = 3;

            PlayerPositionUpdateRequest request = new PlayerPositionUpdateRequest();
            request.setType("P_MOVE");
            request.setPlayerId(PLAYER_ID);
            request.setX(x);
            request.setY(y);
            request.setDir(dir);

            // when
            playerService.handlePlayerState(SESSION_ID, USERNAME, MAP_ID, request);

            // then
            ArgumentCaptor<PlayerPositionUpdateResponse> responseCaptor = ArgumentCaptor
                    .forClass(PlayerPositionUpdateResponse.class);
            verify(simpMessagingTemplate).convertAndSend(eq("/topic/map/" + MAP_ID), responseCaptor.capture());

            PlayerPositionUpdateResponse capturedResponse = responseCaptor.getValue();
            assertThat(capturedResponse.getType()).isEqualTo("P_MOVE");
            assertThat(capturedResponse.getPlayerId()).isEqualTo(PLAYER_ID);
            assertThat(capturedResponse.getX()).isEqualTo(x);
            assertThat(capturedResponse.getY()).isEqualTo(y);
            assertThat(capturedResponse.getDir()).isEqualTo(dir);
        }
    }

    @Nested
    @DisplayName("상수 값 테스트")
    class ConstantsTest {

        @Test
        @DisplayName("MAP_INIT_X 값이 800이어야 한다")
        void mapInitXShouldBe800() {
            assertThat(PlayerService.MAP_INIT_X).isEqualTo(800);
        }

        @Test
        @DisplayName("MAP_INIT_Y 값이 488이어야 한다")
        void mapInitYShouldBe488() {
            assertThat(PlayerService.MAP_INIT_Y).isEqualTo(488);
        }

        @Test
        @DisplayName("MAP_INIT_D 값이 2여야 한다")
        void mapInitDShouldBe2() {
            assertThat(PlayerService.MAP_INIT_D).isEqualTo((short) 2);
        }
    }
}
