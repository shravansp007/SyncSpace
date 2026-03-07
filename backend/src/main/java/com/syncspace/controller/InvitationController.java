package com.syncspace.controller;

import com.syncspace.dto.invitation.CreateInvitationRequest;
import com.syncspace.model.Invitation;
import com.syncspace.model.InvitationStatus;
import com.syncspace.model.UserRole;
import com.syncspace.repository.InvitationRepository;
import com.syncspace.service.NotificationService;
import com.syncspace.service.WebSocketService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/invitations")
public class InvitationController {

    private final InvitationRepository invitationRepository;
    private final NotificationService notificationService;
    private final WebSocketService webSocketService;

    public InvitationController(
            InvitationRepository invitationRepository,
            NotificationService notificationService,
            WebSocketService webSocketService
    ) {
        this.invitationRepository = invitationRepository;
        this.notificationService = notificationService;
        this.webSocketService = webSocketService;
    }

    @PostMapping
    public Map<String, Object> createInvitation(Principal principal, @Valid @RequestBody CreateInvitationRequest request) {
        return sendInvitation(principal, request);
    }

    @PostMapping("/send")
    public Map<String, Object> sendInvitation(Principal principal, @Valid @RequestBody CreateInvitationRequest request) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        Invitation invitation = new Invitation();
        invitation.setEmail(request.getEmail().trim().toLowerCase());
        invitation.setRole(UserRole.MEMBER);
        invitation.setInvitedBy(principal.getName());
        invitation.setStatus(InvitationStatus.PENDING);

        Invitation saved = invitationRepository.save(invitation);
        Map<String, Object> payload = toPayload(saved, request.getMeetingId());
        webSocketService.sendToTopic("/topic/invitations", payload);
        notificationService.notifyMeetingInvitation(saved.getEmail(), request.getMeetingId(), principal.getName());
        return payload;
    }

    @GetMapping
    public List<Map<String, Object>> listInvitations() {
        return invitationRepository.findByOrderByCreatedAtDesc().stream()
                .map(invitation -> toPayload(invitation, null))
                .toList();
    }

    private Map<String, Object> toPayload(Invitation invitation, Long meetingId) {
        return Map.of(
                "id", invitation.getId(),
                "email", invitation.getEmail(),
                "role", invitation.getRole().name(),
                "invitedBy", invitation.getInvitedBy(),
                "status", invitation.getStatus().name(),
                "meetingId", meetingId == null ? -1L : meetingId,
                "createdAt", invitation.getCreatedAt()
        );
    }
}
