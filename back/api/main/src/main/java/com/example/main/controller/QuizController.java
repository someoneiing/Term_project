package com.example.main.controller;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.main.dto.QuizDto;
import com.example.main.service.QuizService;

import java.util.List;

@RestController
@RequestMapping("/api/quiz")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class QuizController {
    private final QuizService quizService;

    @PostMapping("")
    public ResponseEntity<QuizDto> saveQuiz(@RequestBody QuizDto dto) {
        return ResponseEntity.ok(quizService.saveQuiz(dto));
    }
}