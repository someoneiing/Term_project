package com.example.main.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.example.main.dto.AuthResponse;
import com.example.main.dto.LoginRequest;
import com.example.main.dto.SignupRequest;
import com.example.main.entity.User;
import com.example.main.repository.UserRepository;
import com.example.main.util.JwtUtil;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + username));
        return user;
    }

    public AuthResponse signup(SignupRequest request) {
        // 중복 검사
        if (userRepository.existsByUsername(request.getUsername())) {
            return AuthResponse.builder()
                    .success(false)
                    .message("이미 존재하는 사용자명입니다")
                    .build();
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            return AuthResponse.builder()
                    .success(false)
                    .message("이미 존재하는 이메일입니다")
                    .build();
        }

        // 사용자 생성
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.USER)
                .build();

        userRepository.save(user);

        // JWT 토큰 생성
        String token = jwtUtil.generateToken(user);

        return AuthResponse.builder()
                .success(true)
                .token(token)
                .username(user.getUsername())
                .userId(user.getId())
                .message("회원가입이 완료되었습니다")
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        try {
            // 사용자 조회
            User user = userRepository.findByUsername(request.getUsername())
                    .orElse(null);
            
            if (user == null) {
                return AuthResponse.builder()
                        .success(false)
                        .message("사용자명 또는 비밀번호가 올바르지 않습니다")
                        .build();
            }

            // 비밀번호 검증
            if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                return AuthResponse.builder()
                        .success(false)
                        .message("사용자명 또는 비밀번호가 올바르지 않습니다")
                        .build();
            }

            // JWT 토큰 생성
            String token = jwtUtil.generateToken(user);

            return AuthResponse.builder()
                    .success(true)
                    .token(token)
                    .username(user.getUsername())
                    .userId(user.getId())
                    .message("로그인이 완료되었습니다")
                    .build();
        } catch (Exception e) {
            return AuthResponse.builder()
                    .success(false)
                    .message("로그인 중 오류가 발생했습니다")
                    .build();
        }
    }
} 