package com.example.main;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;

@SpringBootApplication
@OpenAPIDefinition(
    info = @Info(
        title = "규장각 API",
        version = "1.0.0",
        description = "맞춤형 서고"
    )
)
public class OnandoffApplication {

	public static void main(String[] args) {
		SpringApplication.run(OnandoffApplication.class, args);
	}

}
