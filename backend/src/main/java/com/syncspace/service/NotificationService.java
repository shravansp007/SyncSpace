package com.syncspace.service;

import com.syncspace.dto.chat.ChatMessageResponse;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class NotificationService {

    private final WebSocketService webSocketService;

    public NotificationService(WebSocketService webSocketService) {
        this.webSocketService = webSocketService;
    }

    public void notifyMeetingInvitation(String receiverEmail, Long meetingId, String invitedBy) {
        Map<String, Object> payload = Map.of(
                "type", "MEETING_INVITE",
                "meetingId", meetingId == null ? -1L : meetingId,
                "invitedBy", invitedBy == null ? "" : invitedBy
        );
        webSocketService.sendToUser(receiverEmail, "/queue/invitations", payload);
        webSocketService.sendToUser(receiverEmail, "/queue/notifications", payload);
    }

    public void notifyChatMessage(String receiverEmail, ChatMessageResponse message) {
        Map<String, Object> payload = Map.of(
                "type", "CHAT_MESSAGE",
                "senderEmail", message.getSenderEmail(),
                "receiverEmail", message.getReceiverEmail(),
                "content", message.getContent(),
                "createdAt", message.getCreatedAt(),
                "message", message
        );
        webSocketService.sendToUser(receiverEmail, "/queue/notifications", payload);
    }

    public void notifyMeetingStarted(String receiverEmail, Long meetingId, String startedBy) {
        Map<String, Object> payload = Map.of(
                "type", "MEETING_STARTED",
                "meetingId", meetingId,
                "startedBy", startedBy == null ? "" : startedBy
        );
        webSocketService.sendToUser(receiverEmail, "/queue/notifications", payload);
    }
}
