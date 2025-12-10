package com.example.main.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.main.dto.QuizDto;
import com.example.main.entity.Note;
import com.example.main.entity.Quiz;
import com.example.main.repository.NoteRepository;
import com.example.main.repository.QuizRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuizService {
    @Value("${ai.url}")
    private String aiUrl;
    private final QuizRepository quizRepository;
    private final NoteRepository noteRepository;

    @Transactional
    public QuizDto saveQuiz(QuizDto dto) {
        Note note = noteRepository.findById(dto.getNoteId()).orElseThrow();
        Quiz quiz = Quiz.builder()
                .note(note)
                .question(dto.getQuestion())
                .options(dto.getOptions())
                .answerIndex(dto.getAnswerIndex())
                .explanation(dto.getExplanation())
                .build();
        quizRepository.save(quiz);
        dto.setId(quiz.getId());
        return dto;
    }

    public List<QuizDto> getQuizzesByNoteId(Long noteId) {
        return quizRepository.findByNoteId(noteId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private QuizDto toDto(Quiz quiz) {
        QuizDto dto = new QuizDto();
        dto.setId(quiz.getId());
        dto.setNoteId(quiz.getNote().getId());
        dto.setQuestion(quiz.getQuestion());
        dto.setOptions(quiz.getOptions());
        dto.setAnswerIndex(quiz.getAnswerIndex());
        dto.setExplanation(quiz.getExplanation());
        return dto;
    }
} 