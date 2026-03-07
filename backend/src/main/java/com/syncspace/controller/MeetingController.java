package com.syncspace.controller;

import com.syncspace.dto.meeting.CreateMeetingRequest;
import com.syncspace.model.Meeting;
import com.syncspace.repository.MeetingRepository;
import com.syncspace.service.MeetingService;
import com.syncspace.service.WebSocketService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/meetings")
public class MeetingController {

    private final MeetingRepository meetingRepository;
    private final WebSocketService webSocketService;
    private final MeetingService meetingService;

    public MeetingController(
            MeetingRepository meetingRepository,
            WebSocketService webSocketService,
            MeetingService meetingService
    ) {
        this.meetingRepository = meetingRepository;
        this.webSocketService = webSocketService;
        this.meetingService = meetingService;
    }

    @PostMapping
    public Map<String, Object> createMeeting(Principal principal, @Valid @RequestBody CreateMeetingRequest request) {
        return create(principal, request);
    }

    @PostMapping("/create")
    public Map<String, Object> create(Principal principal, @Valid @RequestBody CreateMeetingRequest request) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        Meeting meeting = new Meeting();
        meeting.setTitle(request.getTitle().trim());
        meeting.setDescription(request.getDescription());
        meeting.setStartTime(request.getStartTime());
        meeting.setDuration(request.getDuration());
        meeting.setParticipants(request.getParticipants());
        meeting.setCreatedBy(principal.getName());
        meeting.setActive(true);

        Meeting saved = meetingRepository.save(meeting);
        Map<String, Object> payload = toPayload(saved);
        webSocketService.sendToTopic("/topic/meetings", Map.of("event", "MEETING_CREATED", "meetingId", saved.getId(), "meeting", payload));
        webSocketService.sendToTopic("/topic/meetings", Map.of("event", "MEETING_STARTED", "meetingId", saved.getId(), "meeting", payload));
        meetingService.notifyMeetingStarted(saved);
        return Map.of(
                "meetingId", saved.getId(),
                "meeting", payload
        );
    }

    @GetMapping
    public List<Map<String, Object>> listMeetings() {
        return meetingRepository.findByOrderByCreatedAtDesc().stream()
                .map(this::toPayload)
                .toList();
    }

    @GetMapping("/active")
    public Map<String, Long> activeMeetingsCount() {
        return Map.of("count", meetingRepository.countByActiveTrue());
    }

    @PostMapping("/{meetingId}/end")
    public Map<String, String> endMeeting(@PathVariable Long meetingId, Principal principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Meeting not found"));

        meeting.setActive(false);
        meetingRepository.save(meeting);
        webSocketService.sendToTopic("/topic/meetings", Map.of("event", "MEETING_ENDED", "meetingId", meeting.getId()));
        return Map.of("message", "Meeting ended.");
    }

    @PostMapping("/join/{meetingId}")
    public Map<String, Object> joinMeeting(@PathVariable Long meetingId, Principal principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Meeting not found"));
        if (!meeting.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Meeting is not active");
        }

        webSocketService.sendToTopic("/topic/meetings", Map.of(
                "event", "MEETING_JOINED",
                "meetingId", meetingId,
                "email", principal.getName()
        ));
        webSocketService.sendToTopic("/topic/notifications", Map.of(
                "type", "MEETING_JOIN",
                "message", principal.getName() + " joined meeting " + meeting.getTitle()
        ));
        return Map.of(
                "meetingId", meeting.getId(),
                "title", meeting.getTitle(),
                "joinPath", "/workspace/meeting/" + meeting.getId()
        );
    }

    private Map<String, Object> toPayload(Meeting meeting) {
        return Map.of(
                "id", meeting.getId(),
                "title", meeting.getTitle(),
                "description", meeting.getDescription() == null ? "" : meeting.getDescription(),
                "createdBy", meeting.getCreatedBy(),
                "startTime", meeting.getStartTime(),
                "startsAt", meeting.getStartTime(),
                "duration", meeting.getDuration(),
                "participants", meeting.getParticipants() == null ? "" : meeting.getParticipants(),
                "active", meeting.isActive(),
                "createdAt", meeting.getCreatedAt()
        );
    }
}
