package com.syncspace.dto.chat;

import java.time.Instant;

public class ChatMessageResponse {
    private Long id;
    private String roomId;
    private String senderEmail;
    private String content;
    private String messageType;
    private Instant createdAt;

    public ChatMessageResponse(Long id, String roomId, String senderEmail, String content, String messageType, Instant createdAt) {
        this.id = id;
        this.roomId = roomId;
        this.senderEmail = senderEmail;
        this.content = content;
        this.messageType = messageType;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public String getRoomId() {
        return roomId;
    }

    public String getSenderEmail() {
        return senderEmail;
    }

    public String getContent() {
        return content;
    }

    public String getMessageType() {
        return messageType;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
