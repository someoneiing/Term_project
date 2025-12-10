package com.example.main.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.time.LocalDate;

@Data
public class NoteDto {
    private Long id;
    private Long userId;
    private String title; // 명
    private String category; // 이수
    private List<String> keywords; // 최대 5개
    private String description; // 기타 설명
    private String content; // GPT 요약
    private List<String> imageUrls; // 여러 이미지 경로
    private String pdfUrl; // PDF 파일 경로
    private List<LocalDateTime> reviewHistory;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDate lastReviewedDate;
    private boolean isPublic; // 공개 여부
    private String userName; // 작성자 이름
}