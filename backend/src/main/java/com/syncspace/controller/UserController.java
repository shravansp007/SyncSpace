package com.syncspace.controller;

import com.syncspace.dto.user.UserPresenceDto;
import com.syncspace.model.User;
import com.syncspace.repository.UserRepository;
import com.syncspace.service.PresenceService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final PresenceService presenceService;

    public UserController(UserRepository userRepository, PresenceService presenceService) {
        this.userRepository = userRepository;
        this.presenceService = presenceService;
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
}
