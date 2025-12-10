package com.example.main.controller;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.example.main.dto.NoteDto;
import com.example.main.dto.QuizDto;
import com.example.main.service.NoteService;
import com.example.main.service.QuizService;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.UUID;
import java.util.List;
import java.nio.charset.StandardCharsets;
import java.net.URLEncoder;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class NoteController {
    private final NoteService noteService;
    private final QuizService quizService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<NoteDto>> getNotesByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(noteService.getNotesByUser(userId));
    }

    @GetMapping("/{noteId}")
    public ResponseEntity<NoteDto> getNote(@PathVariable Long noteId) {
        return noteService.getNote(noteId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{noteId}/quiz")
    public ResponseEntity<List<QuizDto>> getQuizByNote(@PathVariable Long noteId) {
        List<QuizDto> quizzes = quizService.getQuizzesByNoteId(noteId);
        System.out.println("Fetching quizzes for noteId: " + noteId + ", found: " + quizzes.size());
        for (QuizDto quiz : quizzes) {
            System.out.println("Quiz ID: " + quiz.getId() + ", Question: " + quiz.getQuestion());
        }
        return ResponseEntity.ok(quizzes);
    }

    @GetMapping("/public")
    public ResponseEntity<List<NoteDto>> getPublicNotes() {
        return ResponseEntity.ok(noteService.getPublicNotes());
    }

    @PostMapping("/upload-image")
    public ResponseEntity<String> uploadImage(@RequestParam("file") MultipartFile file) throws IOException {
        String originalName = file.getOriginalFilename();
        String ext = "";
        int idx = originalName.lastIndexOf(".");
        if (idx != -1) ext = originalName.substring(idx);
        String fileName = UUID.randomUUID().toString().replace("-", "") + ext;
        String uploadDir = new File("uploads").getAbsolutePath() + File.separator;
        File dir = new File(uploadDir);
        if (!dir.exists()) dir.mkdirs();
        File dest = new File(uploadDir + fileName);
        file.transferTo(dest);
        String encodedFileName = java.net.URLEncoder.encode(fileName, java.nio.charset.StandardCharsets.UTF_8.toString());
        return ResponseEntity.ok("/uploads/" + encodedFileName);
    }

    @PostMapping("/upload-files")
    public ResponseEntity<?> uploadFiles(
            @RequestParam(value = "images", required = false) MultipartFile[] images,
            @RequestParam(value = "pdf", required = false) MultipartFile pdf
    ) throws IOException {
        if (images != null && images.length > 20) {
            return ResponseEntity.badRequest().body("이미지는 최대 20장까지 업로드할 수 있습니다.");
        }
        String uploadDir = new File("uploads").getAbsolutePath() + File.separator;
        File dir = new File(uploadDir);
        if (!dir.exists()) dir.mkdirs();
        List<String> imageUrls = new java.util.ArrayList<>();
        String pdfUrl = null;
        if (images != null) {
            for (MultipartFile file : images) {
                String originalName = file.getOriginalFilename();
                String ext = "";
                int idx = originalName.lastIndexOf(".");
                if (idx != -1) ext = originalName.substring(idx);
                String fileName = UUID.randomUUID().toString().replace("-", "") + ext;
                File dest = new File(uploadDir + fileName);
                file.transferTo(dest);
                String encodedFileName = java.net.URLEncoder.encode(fileName, java.nio.charset.StandardCharsets.UTF_8.toString());
                imageUrls.add("/uploads/" + encodedFileName);
            }
        }
        if (pdf != null) {
            String originalName = pdf.getOriginalFilename();
            String ext = "";
            int idx = originalName.lastIndexOf(".");
            if (idx != -1) ext = originalName.substring(idx);
            String fileName = UUID.randomUUID().toString().replace("-", "") + ext;
            File dest = new File(uploadDir + fileName);
            pdf.transferTo(dest);
            String encodedFileName = java.net.URLEncoder.encode(fileName, java.nio.charset.StandardCharsets.UTF_8.toString());
            pdfUrl = "/uploads/" + encodedFileName;
        }
        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("imageUrls", imageUrls);
        result.put("pdfUrl", pdfUrl);

        //  YOLO logo detection stub:
        List<String> autoHashtags = detectLogoHashtags(imageUrls);
        if (!autoHashtags.isEmpty()) {
            result.put("autoHashtags", autoHashtags);
        }
       
        result.put("logoModel", "yolov8n-custom-stub");
        return ResponseEntity.ok(result);
    }

    @PostMapping("")
    public ResponseEntity<NoteDto> createNote(@RequestBody NoteDto dto) {
        NoteDto created = noteService.createNote(
            dto.getUserId(),
            dto.getTitle(),
            dto.getCategory(),
            dto.getKeywords(),
            dto.getDescription(),
            dto.getImageUrls(),
            dto.getPdfUrl(),
            dto.isPublic()
        );
        return ResponseEntity.ok(created);
    }

    @PatchMapping("/{noteId}/review")
    public ResponseEntity<NoteDto> updateReview(@PathVariable Long noteId) {
        NoteDto updated = noteService.updateReviewTimestamp(noteId);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{noteId}/unreview")
    public ResponseEntity<NoteDto> unreviewNote(@PathVariable Long noteId) {
        NoteDto updated = noteService.unreviewNote(noteId);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{noteId}/quiz/retry")
    public ResponseEntity<?> retryQuiz(@PathVariable Long noteId) {
        NoteDto updated = noteService.retryQuizGeneration(noteId);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{noteId}")
    public ResponseEntity<Void> deleteNote(@PathVariable Long noteId) {
        noteService.deleteNote(noteId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{noteId}")
    public ResponseEntity<NoteDto> updateNote(@PathVariable Long noteId, @RequestBody NoteDto dto) {
        NoteDto updated = noteService.updateNote(noteId, dto);
        return ResponseEntity.ok(updated);
    }

   
    private List<String> detectLogoHashtags(List<String> imageUrls) {
        if (imageUrls == null || imageUrls.isEmpty()) {
            return Collections.emptyList();
        }
        
        boolean foundLogo = imageUrls.stream()
                .map(String::toLowerCase)
                .anyMatch(url -> url.contains("logo") || url.contains("brand"));

        List<String> tags = new ArrayList<>();
        if (foundLogo) {
            tags.add("#LogoDetected");
            tags.add("#AutoTag");
            tags.add("#YOLOv8nStub");
        } else {
            
            tags.add("#NoLogoFound");
            tags.add("#PlaceholderTag");
        }
        return tags;
    }
}
