package com.example.main.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
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
class NoteControllerTest {
    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    private String token;

    @BeforeEach
    void setUp() throws Exception {
        String signupJson = "{\"username\":\"apitestuser\",\"email\":\"apitest@ssu.ac.kr\",\"password\":\"12345678\"}";
        mockMvc.perform(post("/api/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(signupJson));
        String loginJson = "{\"username\":\"apitestuser\",\"password\":\"12345678\"}";
        String response = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson))
                .andReturn().getResponse().getContentAsString();
        token = JsonPath.read(response, "$.token");
    }

    @Test
    void getNotesByUser() throws Exception {
        mockMvc.perform(get("/api/notes/user/1")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void getPublicNotes() throws Exception {
        mockMvc.perform(get("/api/notes/public")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void createNote() throws Exception {
        String noteJson = "{\"userId\":1,\"title\":\"테스트\",\"category\":\"3-2\",\"keywords\":[\"test\"],\"description\":\"설명\",\"imageUrls\":[],\"pdfUrl\":null,\"isPublic\":true}";
        mockMvc.perform(post("/api/notes")
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", "Bearer " + token)
                .content(noteJson))
                .andExpect(status().isOk());
    }
}