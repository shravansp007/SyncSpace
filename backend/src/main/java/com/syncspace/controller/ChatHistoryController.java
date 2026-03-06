package com.syncspace.controller;

import com.syncspace.dto.chat.ChatMessageResponse;
import com.syncspace.model.ChatMessage;
import com.syncspace.repository.ChatMessageRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatHistoryController {

    private final ChatMessageRepository chatMessageRepository;

    public ChatHistoryController(ChatMessageRepository chatMessageRepository) {
        this.chatMessageRepository = chatMessageRepository;
    }

    @GetMapping("/history/{roomId}")
    public List<ChatMessageResponse> history(
            @PathVariable String roomId,
            @RequestParam(name = "limit", defaultValue = "50") int limit
    ) {
        int boundedLimit = Math.min(Math.max(limit, 1), 200);
        List<ChatMessage> messages = chatMessageRepository.findByRoomIdOrderByCreatedAtDesc(
                roomId,
                PageRequest.of(0, boundedLimit)
        );
        Collections.reverse(messages);
        return messages.stream()
                .map(m -> new ChatMessageResponse(
                        m.getId(),
                        m.getRoomId(),
                        m.getSenderEmail(),
                        m.getContent(),
                        m.getMessageType(),
                        m.getCreatedAt()
                ))
                .toList();
    }
}
