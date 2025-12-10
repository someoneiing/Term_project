package com.example.main.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "notes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Note {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String title; // 명

    @Column(nullable = false)
    private String category; // 이수

    @Column(nullable = false)
    private boolean isPublic = false; // 공개 여부(기본값: 비공개)

    @ElementCollection
    @CollectionTable(name = "note_keywords", joinColumns = @JoinColumn(name = "note_id"))
    @Column(name = "keyword")
    private List<String> keywords = new ArrayList<>(); // 최대 5개

    @Column
    private String description; // 기타 설명

    @ElementCollection
    @CollectionTable(name = "note_images", joinColumns = @JoinColumn(name = "note_id"))
    @Column(name = "image_url", columnDefinition = "TEXT")
    private List<String> imageUrls = new ArrayList<>(); // 여러 이미지 경로

    @Column(columnDefinition = "TEXT")
    private String pdfUrl; // PDF 파일 경로

    @Column(columnDefinition = "TEXT")
    private String content; // GPT 요약

    @ElementCollection
    @CollectionTable(name = "note_review_history", joinColumns = @JoinColumn(name = "note_id"))
    @Column(name = "reviewed_at")
    private List<LocalDateTime> reviewHistory = new ArrayList<>();

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "last_reviewed_date")
    private LocalDate lastReviewedDate;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (reviewHistory == null) reviewHistory = new ArrayList<>();
        reviewHistory.add(createdAt); // 업로드 시점도 복습 히스토리에 포함
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
} 