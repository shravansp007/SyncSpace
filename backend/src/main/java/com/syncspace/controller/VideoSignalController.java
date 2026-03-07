package com.syncspace.controller;

import com.syncspace.dto.meeting.VideoSignalMessage;
import jakarta.validation.Valid;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;

@Controller
public class VideoSignalController {

    private final SimpMessagingTemplate messagingTemplate;

    public VideoSignalController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/video.offer")
    public void offer(@Valid VideoSignalMessage message, Principal principal) {
        messagingTemplate.convertAndSend("/topic/video-offer", withSender(message, principal));
    }

    @MessageMapping("/video-offer")
    public void offerAlias(@Valid VideoSignalMessage message, Principal principal) {
        offer(message, principal);
    }

    @MessageMapping("/video.answer")
    public void answer(@Valid VideoSignalMessage message, Principal principal) {
        messagingTemplate.convertAndSend("/topic/video-answer", withSender(message, principal));
    }

    @MessageMapping("/video-answer")
    public void answerAlias(@Valid VideoSignalMessage message, Principal principal) {
        answer(message, principal);
    }

    @MessageMapping("/video.candidate")
    public void candidate(@Valid VideoSignalMessage message, Principal principal) {
        messagingTemplate.convertAndSend("/topic/video-candidate", withSender(message, principal));
    }

    @MessageMapping("/video-candidate")
    public void candidateAlias(@Valid VideoSignalMessage message, Principal principal) {
        candidate(message, principal);
    }

    private Map<String, Object> withSender(VideoSignalMessage message, Principal principal) {
        String sender = principal != null ? principal.getName() : message.getFrom();
        return Map.of(
                "meetingId", message.getMeetingId(),
                "from", sender == null ? "" : sender,
                "to", message.getTo() == null ? "" : message.getTo(),
                "payload", message.getPayload() == null ? Map.of() : message.getPayload()
        );
    }
}
