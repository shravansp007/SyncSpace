package com.syncspace.controller;

import com.syncspace.dto.user.UserPresenceDto;
import com.syncspace.model.User;
import com.syncspace.repository.UserRepository;
import com.syncspace.service.PresenceService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class PresenceController {

    private final UserRepository userRepository;
    private final PresenceService presenceService;

    public PresenceController(UserRepository userRepository, PresenceService presenceService) {
        this.userRepository = userRepository;
        this.presenceService = presenceService;
    }

    @GetMapping("/presence")
    public List<UserPresenceDto> allPresence() {
        return userRepository.findAll().stream()
                .sorted(Comparator.comparing(User::getEmail))
                .map(user -> new UserPresenceDto(
                        user.getId(),
                        user.getName(),
                        user.getEmail(),
                        presenceService.isOnline(user.getEmail()),
                        presenceService.getLastSeen(user.getEmail())
                ))
                .toList();
    }

    @GetMapping("/online")
    public List<UserPresenceDto> onlineUsers() {
        return userRepository.findAll().stream()
                .filter(user -> presenceService.isOnline(user.getEmail()))
                .sorted(Comparator.comparing(User::getEmail))
                .map(user -> new UserPresenceDto(
                        user.getId(),
                        user.getName(),
                        user.getEmail(),
                        true,
                        presenceService.getLastSeen(user.getEmail())
                ))
                .toList();
    }
}
