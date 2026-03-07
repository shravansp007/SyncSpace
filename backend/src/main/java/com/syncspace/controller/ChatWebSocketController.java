package com.syncspace.controller;

import com.syncspace.dto.chat.ChatMessageInbound;
import com.syncspace.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
public class ChatWebSocketController {

    private final ChatService chatService;

    public ChatWebSocketController(
            ChatService chatService
    ) {
        this.chatService = chatService;
    }

    @MessageMapping("/chat.private")
    public void sendMessage(@Valid ChatMessageInbound inbound, Principal principal) {
        chatService.send(inbound, principal == null ? null : principal.getName());
    }

    @MessageMapping("/chat.send")
    public void sendMessageLegacy(@Valid ChatMessageInbound inbound, Principal principal) {
        chatService.send(inbound, principal == null ? null : principal.getName());
    }
}
