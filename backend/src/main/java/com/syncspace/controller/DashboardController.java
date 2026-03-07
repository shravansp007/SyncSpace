package com.syncspace.controller;

import com.syncspace.model.ChatMessage;
import com.syncspace.repository.ChatMessageRepository;
import com.syncspace.repository.MeetingRepository;
import com.syncspace.repository.UserRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class DashboardController {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final MeetingRepository meetingRepository;

    public DashboardController(
            ChatMessageRepository chatMessageRepository,
            UserRepository userRepository,
            MeetingRepository meetingRepository
    ) {
        this.chatMessageRepository = chatMessageRepository;
        this.userRepository = userRepository;
        this.meetingRepository = meetingRepository;
    }

    @GetMapping("/messages/today")
    @Cacheable("dashboardMessagesToday")
    public Map<String, Long> messagesToday() {
        Instant startOfDay = LocalDate.now()
                .atStartOfDay(ZoneId.systemDefault())
                .toInstant();

        long count = chatMessageRepository.countByCreatedAtGreaterThanEqual(startOfDay);
        return Map.of("count", count);
    }

    @GetMapping("/dashboard/stats")
    @Cacheable("dashboardStats")
    public Map<String, Long> dashboardStats() {
        return Map.of(
                "totalUsers", userRepository.count(),
                "totalMessages", chatMessageRepository.count(),
                "activeMeetings", meetingRepository.countByActiveTrue()
        );
    }

    @GetMapping("/activity/recent")
    public List<Map<String, Object>> recentActivity() {
        return chatMessageRepository.findTop10ByOrderByCreatedAtDesc().stream()
                .map(this::toActivity)
                .toList();
    }

    private Map<String, Object> toActivity(ChatMessage message) {
        return Map.of(
                "message", message.getSenderEmail() + " messaged " + message.getReceiverEmail(),
                "createdAt", message.getCreatedAt()
        );
    }
}
