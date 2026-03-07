package com.syncspace.service;

import com.syncspace.dto.chat.ChatMessageInbound;
import com.syncspace.dto.chat.ChatMessageResponse;
import com.syncspace.model.ChatMessage;
import com.syncspace.repository.ChatMessageRepository;
import com.syncspace.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Locale;

@Service
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final WebSocketService webSocketService;

    public ChatService(
            ChatMessageRepository chatMessageRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            WebSocketService webSocketService
    ) {
        this.chatMessageRepository = chatMessageRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.webSocketService = webSocketService;
    }

    public ChatMessageResponse send(ChatMessageInbound inbound, String authenticatedSenderEmail) {
        String senderEmail = normalize(authenticatedSenderEmail != null ? authenticatedSenderEmail : inbound.getSenderEmail());
        String receiverEmail = normalize(inbound.getReceiverEmail());
        String content = inbound.getContent() == null ? "" : inbound.getContent().trim();

        if (senderEmail == null || receiverEmail == null || content.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid chat payload");
        }
        if (senderEmail.equals(receiverEmail)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot message yourself");
        }
        if (userRepository.findByEmail(senderEmail).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown sender");
        }
        if (userRepository.findByEmail(receiverEmail).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown receiver");
        }

        ChatMessage entity = new ChatMessage();
        entity.setSenderEmail(senderEmail);
        entity.setReceiverEmail(receiverEmail);
        entity.setContent(content);

        ChatMessage saved = chatMessageRepository.save(entity);
        ChatMessageResponse response = toResponse(saved);

        webSocketService.sendToUser(receiverEmail, "/queue/messages", response);
        webSocketService.sendToUser(senderEmail, "/queue/messages", response);
        notificationService.notifyChatMessage(receiverEmail, response);

        return response;
    }

    public List<ChatMessageResponse> history(String authenticatedUserEmail, String peerEmail) {
        String userEmail = normalize(authenticatedUserEmail);
        String normalizedPeer = normalize(peerEmail);
        if (userEmail == null || normalizedPeer == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid user email");
        }

        return chatMessageRepository.findConversation(userEmail, normalizedPeer).stream()
                .map(this::toResponse)
                .toList();
    }

    private ChatMessageResponse toResponse(ChatMessage message) {
        return new ChatMessageResponse(
                message.getId(),
                message.getSenderEmail(),
                message.getReceiverEmail(),
                message.getContent(),
                message.getCreatedAt()
        );
    }

    private String normalize(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
