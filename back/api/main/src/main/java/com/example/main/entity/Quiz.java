package com.example.main.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Quiz {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "note_id")
    private Note note;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String question;

    @ElementCollection
    @CollectionTable(name = "quiz_options", joinColumns = @JoinColumn(name = "quiz_id"))
    @Column(name = "option_text") // avoid MySQL reserved keyword "option"
    private List<String> options = new ArrayList<>(); // 5개

    @Column(nullable = false)
    private int answerIndex; // 0~4
    @Column(columnDefinition = "TEXT")
    private String explanation; // 해설

    @Builder
    public Quiz(Note note, String question, List<String> options, int answerIndex, String explanation) {
        this.note = note;
        this.question = question;
        this.options = options;
        this.answerIndex = answerIndex;
        this.explanation = explanation;
    }
} 
