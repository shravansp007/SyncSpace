package com.syncspace.controller;

import com.syncspace.dto.chat.ChatMessageResponse;
import com.syncspace.dto.chat.ChatMessageInbound;
import com.syncspace.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/chat", "/chat"})
public class ChatHistoryController {

    private final ChatService chatService;

    public ChatHistoryController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping("/send")
    public ChatMessageResponse send(Principal principal, @Valid @RequestBody ChatMessageInbound request) {
        String email = principal == null ? null : principal.getName();
        if (email == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return chatService.send(request, email);
    }

    @GetMapping("/history/{receiverEmail}")
    public List<ChatMessageResponse> history(
            Principal principal,
            @PathVariable String receiverEmail,
            @RequestParam(name = "limit", defaultValue = "200") int limit
    ) {
        String email = principal == null ? null : principal.getName();
        if (email == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        int boundedLimit = Math.min(Math.max(limit, 1), 500);
        List<ChatMessageResponse> all = chatService.history(email, receiverEmail);
        int from = Math.max(all.size() - boundedLimit, 0);
        return all.subList(from, all.size());
    }

    @GetMapping("/messages/{receiverEmail}")
    public Map<String, Object> paginatedMessages(
            Principal principal,
            @PathVariable String receiverEmail,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size
    ) {
        String email = principal == null ? null : principal.getName();
        if (email == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        int boundedPage = Math.max(page, 0);
        int boundedSize = Math.min(Math.max(size, 1), 100);
        List<ChatMessageResponse> all = chatService.history(email, receiverEmail);
        int from = Math.min(boundedPage * boundedSize, all.size());
        int to = Math.min(from + boundedSize, all.size());
        List<ChatMessageResponse> pageContent = all.subList(from, to);

        return Map.of(
                "content", pageContent,
                "page", boundedPage,
                "size", boundedSize,
                "totalElements", all.size(),
                "totalPages", (int) Math.ceil((double) all.size() / boundedSize),
                "hasNext", to < all.size()
        );
    }
}
