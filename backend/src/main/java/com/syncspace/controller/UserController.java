package com.syncspace.controller;

import com.syncspace.dto.user.UserPresenceDto;
import com.syncspace.dto.user.UpdatePasswordRequest;
import com.syncspace.dto.user.UpdateProfileRequest;
import com.syncspace.model.User;
import com.syncspace.repository.UserRepository;
import com.syncspace.service.PresenceService;
import com.syncspace.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/users", "/users"})
public class UserController {

    private final UserRepository userRepository;
    private final PresenceService presenceService;
    private final UserService userService;

    public UserController(UserRepository userRepository, PresenceService presenceService, UserService userService) {
        this.userRepository = userRepository;
        this.presenceService = presenceService;
        this.userService = userService;
    }

    @GetMapping("/me")
    public UserPresenceDto me(Principal principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized"));

        return new UserPresenceDto(
                user.getId(),
                user.getName(),
                user.getEmail(),
                presenceService.isOnline(user.getEmail()),
                presenceService.getLastSeen(user.getEmail())
        );
    }

    @GetMapping
    public List<Map<String, Object>> allUsers() {
        return userRepository.findAll().stream()
                .map(user -> Map.<String, Object>of(
                        "id", user.getId(),
                        "name", user.getName(),
                        "email", user.getEmail(),
                        "role", user.getRole().name(),
                        "status", presenceService.isOnline(user.getEmail()) ? "online" : "offline"
                ))
                .toList();
    }

    @GetMapping("/count")
    public Map<String, Long> usersCount() {
        return Map.of("count", userRepository.count());
    }

    @GetMapping("/active")
    public List<Map<String, Object>> activeUsers() {
        return userRepository.findAll().stream()
                .filter(user -> presenceService.onlineEmails().contains(user.getEmail()))
                .map(user -> Map.<String, Object>of(
                        "id", user.getId(),
                        "name", user.getName(),
                        "email", user.getEmail(),
                        "role", user.getRole().name(),
                        "status", "online"
                ))
                .toList();
    }

    @PutMapping("/profile")
    public Map<String, Object> updateProfile(Principal principal, @Valid @RequestBody UpdateProfileRequest request) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        User updated = userService.updateProfile(principal.getName(), request.getName(), request.getEmail());
        return Map.of(
                "id", updated.getId(),
                "name", updated.getName(),
                "email", updated.getEmail(),
                "role", updated.getRole().name()
        );
    }

    @PutMapping("/password")
    public Map<String, String> updatePassword(Principal principal, @Valid @RequestBody UpdatePasswordRequest request) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        userService.updatePassword(principal.getName(), request.getCurrentPassword(), request.getNewPassword());
        return Map.of("message", "Password updated successfully.");
    }
}
