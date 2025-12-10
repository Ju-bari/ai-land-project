package com.rally.ai_land.common.websocket;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${cors.allowed-origins}")
    private String[] allowedOrigins;

    public static final String WEBSOCKET_ENDPOINT = "/ws";
    public static final String[] SIMPLE_BROKER = new String[]{"/topic", "/queue"};
    public static final String APPLICATION_DEST= "/app";
    public static final String USER_DEST= "/user";


    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint(WEBSOCKET_ENDPOINT)
                .setAllowedOriginPatterns(allowedOrigins)
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // 메시지 전송 경로
        // /user: 특정 유저에게 보낼 때 사용하는 접두사 (기본값이지만 명시)
        registry.setApplicationDestinationPrefixes(APPLICATION_DEST);
        registry.setUserDestinationPrefix(USER_DEST);

        // 구독 경로, 심플 브로커 사용
        // /topic: 여러 명에게 (Pub/Sub)
        // /queue: 한 명에게 (Point-to-Point)
        registry.enableSimpleBroker(SIMPLE_BROKER);

    }
}
