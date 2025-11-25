package com.rally.ai_land.domain.user.service;

import com.rally.ai_land.domain.user.dto.UserCreateRequest;
import com.rally.ai_land.domain.user.entity.User;
import com.rally.ai_land.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;


    public Long createUser(UserCreateRequest userCreateRequest) {
        User user = User.builder()
//                .email()
//                .password()
                .username(userCreateRequest.getName())
                .build();

        return userRepository.save(user).getId();
    }

}
