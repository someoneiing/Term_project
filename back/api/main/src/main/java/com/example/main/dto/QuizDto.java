package com.example.main.dto;

import lombok.Data;
import java.util.List;

@Data
public class QuizDto {
    private Long id;
    private Long noteId;
    private String question;
    private List<String> options;
    private int answerIndex;
    private String explanation;

    public String getExplanation() {
        return explanation;
    }
    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }
} 