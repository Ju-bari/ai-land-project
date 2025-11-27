package com.rally.ai_land.common.auth;

import com.rally.ai_land.domain.user.repository.JwtRefreshRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class ScheduleConfig {

    private final JwtRefreshRepository jwtRefreshRepository;


    // Refresh 토큰 저장소 8일 지난 토큰 삭제
    // TODO: Redis 로 변경 시 필요한지 점검 필요
    @Scheduled(cron = "0 0 3 * * *")
    public void refreshEntityTtlSchedule() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(8);
        jwtRefreshRepository.deleteByCreatedAtBefore(cutoff);
    }
}