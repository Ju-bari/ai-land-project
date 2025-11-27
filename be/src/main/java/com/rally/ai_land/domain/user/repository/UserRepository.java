package com.rally.ai_land.domain.user.repository;

import com.rally.ai_land.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.CrudRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Boolean existsByUsername(String username);

    Optional<User> findByUsernameAndIsLockAndIsSocial(String username, Boolean isLock, Boolean isSocial);

    Optional<User> findByUsernameAndIsSocial(String username, Boolean social);

    Optional<User> findByUsernameAndIsLock(String username, Boolean isLock);

    @Transactional
    void deleteByUsername(String username);
}
