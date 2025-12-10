package com.rally.ai_land.common.websocket;

import com.rally.ai_land.common.auth.JwtUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
public class JwtChannelInterceptor implements ChannelInterceptor {

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null) {
            return message;
        }

        // STOMP CONNECT 명령일 때만 인증 처리
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authorization = accessor.getFirstNativeHeader("Authorization");

            if (authorization == null || authorization.isBlank()) {
                log.warn("[WebSocket] 인증 헤더가 없습니다. 연결을 거부합니다.");
                throw new IllegalArgumentException("Authorization header is missing");
            }

            if (!authorization.startsWith("Bearer ")) {
                log.warn("[WebSocket] 잘못된 인증 헤더 형식입니다.");
                throw new IllegalArgumentException("Invalid Authorization header format");
            }

            String accessToken = authorization.substring(7);

            if (!JwtUtil.isValid(accessToken, true)) {
                log.warn("[WebSocket] 유효하지 않은 JWT 토큰입니다.");
                throw new IllegalArgumentException("Invalid or expired JWT token");
            }

            // JWT 에서 사용자 정보 추출
            String username = JwtUtil.getUsername(accessToken);
            String role = JwtUtil.getRole(accessToken);

            log.info("[WebSocket] JWT 인증 성공 - username: {}, role: {}", username, role);

            // Spring Security 인증 객체 생성
            List<GrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority(role));
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(username, null,
                    authorities);

            // Principal 설정 (이후 컨트롤러에서 principal.getName()으로 접근 가능)
            accessor.setUser(authentication);
        }

        return message;
    }
}
