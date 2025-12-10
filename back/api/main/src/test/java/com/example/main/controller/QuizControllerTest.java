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
class QuizControllerTest {
    @Autowired
    private MockMvc mockMvc;
    private String token;

    @BeforeEach
    void setUp() throws Exception {
        String signupJson = "{\"username\":\"apitestuser3\",\"email\":\"apitest3@ssu.ac.kr\",\"password\":\"12345678\"}";
        mockMvc.perform(post("/api/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(signupJson));
        String loginJson = "{\"username\":\"apitestuser3\",\"password\":\"12345678\"}";
        String response = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson))
                .andReturn().getResponse().getContentAsString();
        token = JsonPath.read(response, "$.token");
    }
}