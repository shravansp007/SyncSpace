package com.syncspace.dto.chat;

import java.time.Instant;

public class ChatMessageResponse {
    private Long id;
    private String senderEmail;
    private String receiverEmail;
    private String content;
    private Instant createdAt;

    public ChatMessageResponse(Long id, String senderEmail, String receiverEmail, String content, Instant createdAt) {
        this.id = id;
        this.senderEmail = senderEmail;
        this.receiverEmail = receiverEmail;
        this.content = content;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public String getSenderEmail() {
        return senderEmail;
    }

    public String getReceiverEmail() {
        return receiverEmail;
    }

    public String getContent() {
        return content;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
