package com.example.main.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import com.example.main.dto.NoteDto;
import com.example.main.entity.Note;
import com.example.main.entity.Quiz;
import com.example.main.entity.User;
import com.example.main.repository.NoteRepository;
import com.example.main.repository.QuizRepository;
import com.example.main.repository.UserRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import java.util.HashMap;
import java.util.Map;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;

import java.io.File;

@Service
@RequiredArgsConstructor
public class NoteService {
    private final NoteRepository noteRepository;
    private final UserRepository userRepository;
    private final QuizRepository quizRepository;

    @Value("${ai.url}")
    private String aiUrl;

    public List<NoteDto> getNotesByUser(Long userId) {
        return noteRepository.findByUserId(userId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public Optional<NoteDto> getNote(Long noteId) {
        return noteRepository.findById(noteId).map(this::toDto);
    }

    public List<NoteDto> getPublicNotes() {
        return noteRepository.findByIsPublicTrue().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public NoteDto createNote(Long userId, String title, String category, List<String> keywords, String description, List<String> imageUrls, String pdfUrl, boolean isPublic) {
        User user = userRepository.findById(userId).orElseThrow();
        Note note = Note.builder()
                .user(user)
                .title(title)
                .category(category)
                .keywords(keywords)
                .description(description)
                .imageUrls(imageUrls)
                .pdfUrl(pdfUrl)
                .isPublic(isPublic)
                .build();
        noteRepository.save(note);

        // AI 서버에 요청
        try {
            RestTemplate restTemplate = new RestTemplate();
            String aiUrl = this.aiUrl + "/generate";
            Map<String, Object> req = new HashMap<>();
            req.put("noteId", note.getId());
            req.put("title", title);
            req.put("keywords", keywords);
            req.put("description", description);
            req.put("imageUrls", imageUrls);
            req.put("pdfUrl", pdfUrl);

            System.out.println("Image URLs: " + imageUrls);
            System.out.println("PDF URL: " + pdfUrl);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(req, headers);

            ResponseEntity<Map> aiRes = restTemplate.postForEntity(aiUrl, entity, Map.class);

            // content, quiz 파싱
            if (aiRes.getStatusCode().is2xxSuccessful() && aiRes.getBody() != null) {
                Object contentObj = aiRes.getBody().get("content");
                if (contentObj instanceof String) {
                    note.setContent((String) contentObj);
                    noteRepository.save(note);
                }
                Object quizObj = aiRes.getBody().get("quiz");
                if (quizObj instanceof java.util.List) {
                    java.util.List quizList = (java.util.List) quizObj;
                    for (Object q : quizList) {
                        if (q instanceof Map) {
                            Map qMap = (Map) q;
                            Quiz quiz = Quiz.builder()
                                .note(note)
                                .question((String) qMap.get("question"))
                                .options((java.util.List<String>) qMap.get("options"))
                                .answerIndex((Integer) qMap.get("answerIndex"))
                                .explanation((String) qMap.get("explanation"))
                                .build();
                            quizRepository.save(quiz);
                        }
                    }
                }
            }
        } catch (Exception e) {
            // AI 서버 실패 시 무시(노트만 저장)
            e.printStackTrace();
        }

        return toDto(note);
    }

    @Transactional
    public NoteDto addReview(Long noteId) {
        Note note = noteRepository.findById(noteId).orElseThrow();
        note.getReviewHistory().add(LocalDateTime.now());
        noteRepository.save(note);
        return toDto(note);
    }

    @Transactional
    public NoteDto updateReviewTimestamp(Long noteId) {
        Note note = noteRepository.findById(noteId).orElseThrow();
        note.getReviewHistory().clear();
        note.getReviewHistory().add(LocalDateTime.now());
        note.setLastReviewedDate(LocalDate.now());
        noteRepository.save(note);
        return toDto(note);
    }

    @Transactional
    public NoteDto unreviewNote(Long noteId) {
        Note note = noteRepository.findById(noteId).orElseThrow();
        note.setLastReviewedDate(null);
        noteRepository.save(note);
        return toDto(note);
    }

    @Transactional
    public void deleteNote(Long noteId) {
        Note note = noteRepository.findById(noteId).orElseThrow();
        // 파일 삭제
        if (note.getImageUrls() != null) {
            for (String url : note.getImageUrls()) {
                if (url != null && url.startsWith("/uploads/")) {
                    File file = new File("." + url);
                    if (file.exists()) file.delete();
                }
            }
        }
        if (note.getPdfUrl() != null && note.getPdfUrl().startsWith("/uploads/")) {
            File file = new File("." + note.getPdfUrl());
            if (file.exists()) file.delete();
        }
        // DB 삭제
        quizRepository.deleteByNoteId(noteId);
        noteRepository.deleteById(noteId);
    }

    @Transactional
    public NoteDto updateNote(Long noteId, NoteDto dto) {
        Note note = noteRepository.findById(noteId).orElseThrow();

        // 업데이트 가능한 필드들만 수정
        if (dto.getTitle() != null) {
            note.setTitle(dto.getTitle());
        }
        if (dto.getCategory() != null) {
            note.setCategory(dto.getCategory());
        }
        if (dto.getDescription() != null) {
            note.setDescription(dto.getDescription());
        }
        if (dto.getKeywords() != null) {
            note.setKeywords(dto.getKeywords());
        }
        if (dto.getContent() != null) {
            note.setContent(dto.getContent());
        }
        System.out.println((dto.isPublic()));
        note.setPublic(dto.isPublic());
        noteRepository.save(note);
        return toDto(note);
    }

    @Transactional
    public NoteDto retryQuizGeneration(Long noteId) {
        Note note = noteRepository.findById(noteId).orElseThrow();
        // AI 서버에 퀴즈 생성 요청
        try {
            RestTemplate restTemplate = new RestTemplate();
            String aiQuizUrl = this.aiUrl + "/api/ai/quiz/generate";
            Map<String, Object> req = new HashMap<>();
            req.put("note_text", note.getContent() != null ? note.getContent() : note.getDescription());
            req.put("imageUrls", note.getImageUrls());
            req.put("pdfUrl", note.getPdfUrl());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(req, headers);

            ResponseEntity<Map> aiRes = restTemplate.postForEntity(aiQuizUrl, entity, Map.class);

            // 기존 퀴즈 삭제
            quizRepository.deleteByNoteId(noteId);

            // 새 퀴즈 저장
            if (aiRes.getStatusCode().is2xxSuccessful() && aiRes.getBody() != null) {
                Object quizObj = aiRes.getBody().get("quiz");
                if (quizObj instanceof java.util.List) {
                    java.util.List quizList = (java.util.List) quizObj;
                    for (Object q : quizList) {
                        if (q instanceof Map) {
                            Map qMap = (Map) q;
                            Quiz quiz = Quiz.builder()
                                .note(note)
                                .question((String) qMap.get("question"))
                                .options((java.util.List<String>) qMap.get("options"))
                                .answerIndex((Integer) qMap.get("answerIndex"))
                                .explanation((String) qMap.get("explanation"))
                                .build();
                            quizRepository.save(quiz);
                        }
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return toDto(note);
    }

    private NoteDto toDto(Note note) {
        NoteDto dto = new NoteDto();
        dto.setId(note.getId());
        dto.setUserId(note.getUser().getId());
        dto.setTitle(note.getTitle());
        dto.setCategory(note.getCategory());
        dto.setKeywords(note.getKeywords());
        dto.setDescription(note.getDescription());
        dto.setImageUrls(note.getImageUrls());
        dto.setPdfUrl(note.getPdfUrl());
        dto.setContent(note.getContent());
        dto.setPublic(note.isPublic());
        dto.setUserName(note.getUser() != null ? note.getUser().getUsername() : "");
        dto.setReviewHistory(note.getReviewHistory());
        dto.setCreatedAt(note.getCreatedAt());
        dto.setUpdatedAt(note.getUpdatedAt());
        dto.setLastReviewedDate(note.getLastReviewedDate());
        return dto;
    }
} 