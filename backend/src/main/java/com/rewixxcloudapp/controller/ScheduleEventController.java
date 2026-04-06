package com.rewixxcloudapp.controller;

import com.rewixxcloudapp.config.JwtUtil;
import com.rewixxcloudapp.entity.ScheduleEvent;
import com.rewixxcloudapp.repository.ScheduleEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/schedule-events")
@CrossOrigin(origins = "*")
public class ScheduleEventController {

    private static final Logger logger = LoggerFactory.getLogger(ScheduleEventController.class);

    @Autowired
    private ScheduleEventRepository scheduleEventRepository;

    @Autowired
    private JwtUtil jwtUtil;

    private Long getUserIdFromRequest(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            return jwtUtil.getUserIdFromToken(token);
        }
        return null;
    }

    @GetMapping
    public ResponseEntity<?> getAllEvents(HttpServletRequest request) {
        try {
            Long userId = getUserIdFromRequest(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            List<ScheduleEvent> events = scheduleEventRepository.findByUserIdOrderByEventDateAsc(userId);
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            logger.error("Error fetching schedule events", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error fetching events: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createEvent(@RequestBody Map<String, String> body, HttpServletRequest request) {
        try {
            Long userId = getUserIdFromRequest(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }

            ScheduleEvent event = new ScheduleEvent();
            event.setUserId(userId);
            event.setTitle(body.get("title"));
            event.setEventDate(LocalDate.parse(body.get("eventDate")));
            event.setEventTime(body.get("eventTime"));
            event.setNotes(body.get("notes"));
            event.setColor(body.getOrDefault("color", "blue"));

            ScheduleEvent saved = scheduleEventRepository.save(event);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            logger.error("Error creating schedule event", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error creating event: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateEvent(@PathVariable Long id, @RequestBody Map<String, String> body, HttpServletRequest request) {
        try {
            Long userId = getUserIdFromRequest(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }

            Optional<ScheduleEvent> existing = scheduleEventRepository.findByIdAndUserId(id, userId);
            if (existing.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Event not found"));
            }

            ScheduleEvent event = existing.get();
            if (body.containsKey("title")) event.setTitle(body.get("title"));
            if (body.containsKey("eventDate")) event.setEventDate(LocalDate.parse(body.get("eventDate")));
            if (body.containsKey("eventTime")) event.setEventTime(body.get("eventTime"));
            if (body.containsKey("notes")) event.setNotes(body.get("notes"));
            if (body.containsKey("color")) event.setColor(body.get("color"));

            ScheduleEvent saved = scheduleEventRepository.save(event);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            logger.error("Error updating schedule event", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error updating event: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long id, HttpServletRequest request) {
        try {
            Long userId = getUserIdFromRequest(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }

            Optional<ScheduleEvent> existing = scheduleEventRepository.findByIdAndUserId(id, userId);
            if (existing.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Event not found"));
            }

            scheduleEventRepository.delete(existing.get());
            return ResponseEntity.ok(Map.of("message", "Event deleted"));
        } catch (Exception e) {
            logger.error("Error deleting schedule event", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error deleting event: " + e.getMessage()));
        }
    }
}
