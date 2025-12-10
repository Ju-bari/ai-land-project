package com.rally.ai_land.domain.user.repository;

import com.rally.ai_land.domain.user.entity.JwtRefresh;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

public interface refreshRepository extends JpaRepository<JwtRefresh, Long> {

    Boolean existsByRefresh(String jwtRefresh);

    @Transactional
    void deleteByRefresh(String jwtRefresh);

    @Transactional
    void deleteByUsername(String username);

    @Transactional
    void deleteByCreatedAtBefore(LocalDateTime createdDate);
}
