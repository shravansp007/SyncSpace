package com.syncspace.repository;

import com.syncspace.model.Meeting;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MeetingRepository extends JpaRepository<Meeting, Long> {
    List<Meeting> findByOrderByCreatedAtDesc();
    long countByActiveTrue();
}
