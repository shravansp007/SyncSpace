package com.syncspace.service;

import com.syncspace.dto.auth.AuthResponse;
import com.syncspace.dto.auth.LoginRequest;
import com.syncspace.dto.auth.RegisterRequest;
import com.syncspace.model.PasswordResetToken;
import com.syncspace.exception.EmailAlreadyExistsException;
import com.syncspace.exception.InvalidCredentialsException;
import com.syncspace.model.User;
import com.syncspace.model.UserRole;
import com.syncspace.repository.PasswordResetTokenRepository;
import com.syncspace.repository.UserRepository;
import com.syncspace.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
public class UserService {

    private static final String BCRYPT_PATTERN = "^\\$2[aby]\\$\\d{2}\\$[./A-Za-z0-9]{53}$";
    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtUtil jwtUtil,
            PasswordResetTokenRepository passwordResetTokenRepository
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            throw new EmailAlreadyExistsException();
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(UserRole.MEMBER);
        user = userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail());
        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail());
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(InvalidCredentialsException::new);

        migrateLegacyPasswordIfNeeded(user, request.getPassword());

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword())
            );
        } catch (BadCredentialsException ex) {
            throw new InvalidCredentialsException();
        } catch (AuthenticationException ex) {
            throw new InvalidCredentialsException();
        }

        String token = jwtUtil.generateToken(user.getEmail());
        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail());
    }

    @Transactional
    public String forgotPassword(String email) {
        String normalizedEmail = normalizeEmail(email);
        if (normalizedEmail == null) {
            return null;
        }

        return userRepository.findByEmail(normalizedEmail).map(user -> {
            passwordResetTokenRepository.deleteByEmail(normalizedEmail);

            PasswordResetToken resetToken = new PasswordResetToken();
            resetToken.setEmail(normalizedEmail);
            resetToken.setToken(UUID.randomUUID().toString().replace("-", ""));
            resetToken.setExpiryTime(Instant.now().plus(15, ChronoUnit.MINUTES));
            passwordResetTokenRepository.save(resetToken);

            log.info("Password reset token for {}: {}",
                    normalizedEmail, resetToken.getToken());
            return resetToken.getToken();
        }).orElse(null);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(InvalidCredentialsException::new);

        if (resetToken.getExpiryTime().isBefore(Instant.now())) {
            throw new InvalidCredentialsException();
        }

        User user = userRepository.findByEmail(resetToken.getEmail())
                .orElseThrow(InvalidCredentialsException::new);
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        passwordResetTokenRepository.delete(resetToken);
    }

    @Transactional
    public User updateProfile(String principalEmail, String name, String email) {
        User user = userRepository.findByEmail(normalizeEmail(principalEmail))
                .orElseThrow(InvalidCredentialsException::new);

        String normalizedEmail = normalizeEmail(email);
        if (!user.getEmail().equals(normalizedEmail) && userRepository.findByEmail(normalizedEmail).isPresent()) {
            throw new EmailAlreadyExistsException();
        }

        user.setName(name);
        user.setEmail(normalizedEmail);
        return userRepository.save(user);
    }

    @Transactional
    public void updatePassword(String principalEmail, String currentPassword, String newPassword) {
        User user = userRepository.findByEmail(normalizeEmail(principalEmail))
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new InvalidCredentialsException();
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    private void migrateLegacyPasswordIfNeeded(User user, String rawPassword) {
        String storedPassword = user.getPassword();
        if (storedPassword == null || storedPassword.matches(BCRYPT_PATTERN)) {
            return;
        }

        if (!storedPassword.equals(rawPassword)) {
            throw new InvalidCredentialsException();
        }

        user.setPassword(passwordEncoder.encode(rawPassword));
        userRepository.save(user);
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }
}
