package com.syncspace.repository;

import com.syncspace.model.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    long countByCreatedAtGreaterThanEqual(Instant start);
    List<ChatMessage> findTop10ByOrderByCreatedAtDesc();

    @Query("""
            SELECT m FROM ChatMessage m
            WHERE ((m.senderEmail = :userEmail AND m.receiverEmail = :peerEmail)
               OR  (m.senderEmail = :peerEmail AND m.receiverEmail = :userEmail))
            ORDER BY m.createdAt ASC
            """)
    List<ChatMessage> findConversation(String userEmail, String peerEmail);

    @Query("""
            SELECT m FROM ChatMessage m
            WHERE ((m.senderEmail = :userEmail AND m.receiverEmail = :peerEmail)
               OR  (m.senderEmail = :peerEmail AND m.receiverEmail = :userEmail))
            ORDER BY m.createdAt DESC
            """)
    Page<ChatMessage> findConversationPage(String userEmail, String peerEmail, Pageable pageable);
}
