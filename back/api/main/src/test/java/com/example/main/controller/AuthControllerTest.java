package com.example.main.controller;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {
    @Autowired
    private MockMvc mockMvc;
    private String token;

    @BeforeEach
    void setUp() throws Exception {
        String signupJson = "{\"username\":\"apitestuser2\",\"email\":\"apitest2@ssu.ac.kr\",\"password\":\"12345678\"}";
        mockMvc.perform(post("/api/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(signupJson));
        String loginJson = "{\"username\":\"apitestuser2\",\"password\":\"12345678\"}";
        String response = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson))
                .andReturn().getResponse().getContentAsString();
        token = JsonPath.read(response, "$.token");
    }

    @Test
    void signup() throws Exception {
        String signupJson = "{\"username\":\"testuser3\",\"email\":\"test3@ssu.ac.kr\",\"password\":\"123456\"}";
        mockMvc.perform(post("/api/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(signupJson))
                .andExpect(status().isOk());
    }

    @Test
    void login() throws Exception {
        String loginJson = "{\"username\":\"apitestuser2\",\"password\":\"12345678\"}";
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson))
                .andExpect(status().isOk());
    }

    // 예시: 인증이 필요한 API 테스트 (실제 AuthController에는 인증이 필요한 API가 없을 수 있음)
    // @Test
    // void someProtectedApi() throws Exception {
    //     mockMvc.perform(get("/api/auth/protected")
    //             .header("Authorization", "Bearer " + token))
    //             .andExpect(status().isOk());
    // }
} 