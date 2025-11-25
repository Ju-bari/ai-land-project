package com.rally.ai_land.domain.user.entity;

import com.rally.ai_land.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Getter
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    // nullable = false
    @Column(name = "password")
    private String password;

    // nullable = false
    @Column(name = "email")
    private String email;

    @Column(name = "username", nullable = false)
    private String username;

}
