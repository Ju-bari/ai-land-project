package com.rally.ai_land;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class AiLandApplication {

	public static void main(String[] args) {
		SpringApplication.run(AiLandApplication.class, args);
	}

}
