package com.syncspace.service;

import com.syncspace.model.Meeting;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;

@Service
public class MeetingService {

    private final NotificationService notificationService;

    public MeetingService(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    public void notifyMeetingStarted(Meeting meeting) {
        if (meeting.getParticipants() == null || meeting.getParticipants().isBlank()) {
            return;
        }

        String creator = normalizeEmail(meeting.getCreatedBy());
        for (String email : extractParticipants(meeting.getParticipants())) {
            if (creator != null && creator.equals(email)) {
                continue;
            }
            notificationService.notifyMeetingStarted(email, meeting.getId(), creator);
        }
    }

    public List<String> extractParticipants(String participants) {
        if (participants == null || participants.isBlank()) {
            return List.of();
        }

        return Arrays.stream(participants.split("[,;\\s]+"))
                .map(this::normalizeEmail)
                .filter(email -> email != null && !email.isBlank())
                .distinct()
                .toList();
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
