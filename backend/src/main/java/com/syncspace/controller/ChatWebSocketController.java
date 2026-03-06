package com.syncspace.controller;

import com.syncspace.dto.chat.ChatMessageInbound;
import com.syncspace.dto.chat.ChatMessageResponse;
import com.syncspace.model.ChatMessage;
import com.syncspace.repository.ChatMessageRepository;
import com.syncspace.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Locale;

@Controller
public class ChatWebSocketController {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatWebSocketController(
            ChatMessageRepository chatMessageRepository,
            UserRepository userRepository,
            SimpMessagingTemplate messagingTemplate
    ) {
        this.chatMessageRepository = chatMessageRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/chat.send")
    public void sendMessage(@Valid ChatMessageInbound inbound, Principal principal) {
        String authenticatedEmail = principal == null ? null : principal.getName();
        String senderEmail = authenticatedEmail != null
                ? authenticatedEmail
                : normalize(inbound.getSenderEmail());

        if (senderEmail == null || userRepository.findByEmail(senderEmail).isEmpty()) {
            throw new IllegalArgumentException("Unknown sender");
        }

        ChatMessage entity = new ChatMessage();
        entity.setRoomId(inbound.getRoomId().trim());
        entity.setSenderEmail(senderEmail);
        entity.setContent(inbound.getContent().trim());
        entity.setMessageType(resolveMessageType(inbound.getMessageType()));
        ChatMessage saved = chatMessageRepository.save(entity);

        ChatMessageResponse response = new ChatMessageResponse(
                saved.getId(),
                saved.getRoomId(),
                saved.getSenderEmail(),
                saved.getContent(),
                saved.getMessageType(),
                saved.getCreatedAt()
        );
        messagingTemplate.convertAndSend("/topic/rooms/" + saved.getRoomId(), response);
    }

    private String resolveMessageType(String messageType) {
        if (messageType == null || messageType.isBlank()) {
            return "MESSAGE";
        }
        return messageType.trim().toUpperCase(Locale.ROOT);
    }

    private String normalize(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }
        return email.trim().toLowerCase();
    }
}
