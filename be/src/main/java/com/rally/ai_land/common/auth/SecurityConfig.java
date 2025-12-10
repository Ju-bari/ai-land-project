package com.rally.ai_land.common.auth;

import com.rally.ai_land.domain.user.entity.UserRoleType;
import com.rally.ai_land.domain.user.service.JwtRefreshService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.logout.LogoutFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

        private final AuthenticationConfiguration authenticationConfiguration;
        private final AuthenticationSuccessHandler loginSuccessHandler;
        private final AuthenticationSuccessHandler socialSuccessHandler;
        private final JwtRefreshService jwtRefreshService;

        @Value("${cors.allowed-origins}")
        private String[] allowedOrigins;

        public SecurityConfig(
                        AuthenticationConfiguration authenticationConfiguration,
                        @Qualifier("CustomLoginSuccessHandler") AuthenticationSuccessHandler loginSuccessHandler,
                        @Qualifier("SocialSuccessHandler") AuthenticationSuccessHandler socialSuccessHandler,
                        JwtRefreshService jwtRefreshService) {
                this.authenticationConfiguration = authenticationConfiguration;
                this.loginSuccessHandler = loginSuccessHandler;
                this.socialSuccessHandler = socialSuccessHandler;
                this.jwtRefreshService = jwtRefreshService;
        }

        // 커스텀 자체 로그인 필터를 위한 AuthenticationManager Bean 수동 등록
        @Bean
        public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration)
                        throws Exception {
                return authenticationConfiguration.getAuthenticationManager();
        }

        // 권한 계층
        @Bean
        public RoleHierarchy roleHierarchy() {
                return RoleHierarchyImpl.withRolePrefix("ROLE_")
                                .role(UserRoleType.ADMIN.name()).implies(UserRoleType.USER.name())
                                .build();
        }

        // 비밀번호 단방향(BCrypt) 암호화용 Bean
        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        // CORS 빈 등록
        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration configuration = new CorsConfiguration();
                configuration.setAllowedOrigins(Arrays.asList(allowedOrigins));
                configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                configuration.setAllowedHeaders(List.of("*"));
                configuration.setAllowCredentials(true);
                configuration.setExposedHeaders(List.of("Authorization", "Set-Cookie"));
                configuration.setMaxAge(3600L);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", configuration);
                return source;
        }

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity httpSecurity) throws Exception {

                // CSRF 보안 필터 disable
                httpSecurity
                        .csrf(AbstractHttpConfigurer::disable);

                // CORS 설정
                httpSecurity
                        .cors(cors -> cors.configurationSource(corsConfigurationSource()));

                // 기본 로그아웃 필터 + 커스텀 Refresh 토큰 삭제 핸들러 추가
                httpSecurity
                        .logout(logout -> logout
                                        .logoutUrl("/api/v1/users/logout") // 로그아웃 Endpoint
                                        .addLogoutHandler(new RefreshTokenLogoutHandler(jwtRefreshService))
                                        .logoutSuccessHandler(new CustomLogoutSuccessHandler())
                                        .permitAll());

                // 기본 Form 기반 인증 필터들 disable -> 커스텀 사용
                httpSecurity
                        .formLogin(AbstractHttpConfigurer::disable);

                // 기본 Basic 인증 필터 disable -> 커스텀 사용
                httpSecurity
                        .httpBasic(AbstractHttpConfigurer::disable);

                // OAuth2 인증용
                httpSecurity
                        .oauth2Login(oauth2 -> oauth2
                                        .successHandler(socialSuccessHandler));

                // 인가 -> 처음에는 permitAll()
                httpSecurity
                        .authorizeHttpRequests(auth -> auth
                                        .requestMatchers("/api/v1/jwt/exchange", "/api/v1/jwt/refresh").permitAll()
                                        .requestMatchers(HttpMethod.POST, "/api/v1/users/exist", "/api/v1/users").permitAll()
                                        .requestMatchers("/api/v1/users/login", "/api/v1/users/logout").permitAll()
                                        .requestMatchers(HttpMethod.GET, "/api/v1/users").hasRole(UserRoleType.USER.name())
                                        .requestMatchers(HttpMethod.PUT, "/api/v1/users").hasRole(UserRoleType.USER.name())
                                        .requestMatchers(HttpMethod.DELETE, "/api/v1/users").hasRole(UserRoleType.USER.name())
                                        .anyRequest().authenticated());

                // WebSocket 해당 설정에서는 permit
                httpSecurity
                        .authorizeHttpRequests(auth -> auth
                                .requestMatchers("/ws/**").permitAll()
                                .anyRequest().authenticated());

                // 예외 처리
                httpSecurity
                        .exceptionHandling(e -> e
                                        .authenticationEntryPoint((request, response, authException) -> {
                                                response.sendError(HttpServletResponse.SC_UNAUTHORIZED); // 401 응답
                                        })
                                        .accessDeniedHandler((request, response, authException) -> {
                                                response.sendError(HttpServletResponse.SC_FORBIDDEN); // 403 응답
                                        }));

                // 커스텀 필터 추가
                /**
                 * - JWTFilter (사용자 정의)
                 * - LogoutFilter (Spring Security 기본)
                 * - ... (기본 필터들: 인증 컨텍스트 처리 등) ...
                 * - LoginFilter (사용자 정의) -> 둘 순서 랜덤
                 * - UsernamePasswordAuthenticationFilter (Spring Security 기본) -> 둘 순서 랜덤
                 */
                httpSecurity
                        .addFilterBefore(new JwtFilter(), LogoutFilter.class);
                httpSecurity
                        .addFilterAt(new LoginFilter(authenticationManager(authenticationConfiguration),
                                        loginSuccessHandler), UsernamePasswordAuthenticationFilter.class);

                // 세션 필터 설정 (STATELESS)
                httpSecurity
                        .sessionManagement(session -> session
                                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS));

                return httpSecurity.build();
        }
}
