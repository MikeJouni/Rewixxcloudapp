package com.rewixxcloudapp.controller;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.rewixxcloudapp.config.JwtUtil;
import com.rewixxcloudapp.entity.AuthUser;
import com.rewixxcloudapp.repository.AuthUserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthUserRepository authUserRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Value("${google.oauth.client-id}")
    private String googleClientId;

    private final RestTemplate restTemplate = new RestTemplate();
    private final SecureRandom secureRandom = new SecureRandom();

    static class GoogleAuthRequest {
        @JsonProperty("idToken")
        public String idToken;
    }

    static class LoginRequest {
        public String email;
        public String password;
        public boolean rememberMe;
    }

    static class ResetPasswordRequest {
        public String email;
    }

    @PostMapping("/google")
    public ResponseEntity<?> loginWithGoogle(@RequestBody GoogleAuthRequest request) {
        try {
            if (request == null || request.idToken == null || request.idToken.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Missing idToken"));
            }

            // Verify token with Google tokeninfo endpoint
            String tokenInfoUrl = "https://oauth2.googleapis.com/tokeninfo?id_token=" + request.idToken;
            Map<String, Object> tokenInfo = restTemplate.getForObject(tokenInfoUrl, Map.class);

            if (tokenInfo == null || tokenInfo.get("aud") == null || tokenInfo.get("email") == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid Google token"));
            }

            String audience = (String) tokenInfo.get("aud");
            String email = (String) tokenInfo.get("email");
            String sub = (String) tokenInfo.get("sub");

            if (!googleClientId.equals(audience)) {
                logger.warn("Google token audience mismatch. Expected {}, got {}", googleClientId, audience);
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid Google token audience"));
            }

            boolean isNewUser = false;
            String defaultPassword = null;

            Optional<AuthUser> existingOpt = authUserRepository.findByEmail(email);
            AuthUser user;
            if (existingOpt.isPresent()) {
                user = existingOpt.get();
            } else {
                // Create new auth user with random default password
                isNewUser = true;
                defaultPassword = generateDefaultPassword();

                user = new AuthUser();
                user.setEmail(email);
                user.setGoogleSub(sub);
                user.setPasswordHash(passwordEncoder.encode(defaultPassword));
                user = authUserRepository.save(user);
            }

            String jwt = jwtUtil.generateToken(user.getId(), user.getEmail());

            Map<String, Object> response = new HashMap<>();
            response.put("token", jwt);
            response.put("isNewUser", isNewUser);
            if (isNewUser) {
                response.put("defaultPassword", defaultPassword);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error during Google login", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Error during Google login: " + e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            if (request == null || request.email == null || request.password == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email and password are required"));
            }

            Optional<AuthUser> userOpt = authUserRepository.findByEmail(request.email.trim().toLowerCase());
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(401).body(Map.of("error", "Invalid email or password"));
            }

            AuthUser user = userOpt.get();
            if (!passwordEncoder.matches(request.password, user.getPasswordHash())) {
                return ResponseEntity.status(401).body(Map.of("error", "Invalid email or password"));
            }

            String jwt = jwtUtil.generateToken(user.getId(), user.getEmail());
            Map<String, Object> response = new HashMap<>();
            response.put("token", jwt);
            response.put("isNewUser", false);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error during email/password login", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Error during login: " + e.getMessage()));
        }
    }

    /**
     * Admin/maintenance endpoint to reset a user's password.
     * In a real deployment this should be protected by proper admin auth.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            if (request == null || request.email == null || request.email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
            }

            String email = request.email.trim().toLowerCase();
            Optional<AuthUser> userOpt = authUserRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found for email: " + email));
            }

            AuthUser user = userOpt.get();
            String tempPassword = generateDefaultPassword();
            user.setPasswordHash(passwordEncoder.encode(tempPassword));
            authUserRepository.save(user);

            Map<String, Object> response = new HashMap<>();
            response.put("email", email);
            response.put("temporaryPassword", tempPassword);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error resetting password", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Error resetting password: " + e.getMessage()));
        }
    }

    private String generateDefaultPassword() {
        byte[] bytes = new byte[12];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}


