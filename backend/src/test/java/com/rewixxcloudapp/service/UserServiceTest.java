package com.rewixxcloudapp.service;

import com.rewixxcloudapp.entity.User;
import com.rewixxcloudapp.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@SpringBootTest
public class UserServiceTest {

    @Autowired
    private UserService userService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private PasswordEncoder passwordEncoder;

    @Test
    public void testGetUserByUsername() {
        String username = "testuser";
        User user = new User() {
            @Override
            public String getUsername() {
                return username;
            }

            @Override
            public String getPassword() {
                return "password";
            }
        };
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        Optional<User> result = userService.getUserByUsername(username);
        assertTrue(result.isPresent());
        assertEquals(username, result.get().getUsername());
    }

    @Test
    public void testSaveUser() {
        User user = new User() {
            @Override
            public String getUsername() {
                return "saveuser";
            }

            @Override
            public String getPassword() {
                return "password";
            }
        };
        when(userRepository.save(any(User.class))).thenReturn(user);
        User saved = userService.saveUser(user);
        assertNotNull(saved);
        assertEquals("saveuser", saved.getUsername());
    }

    @Test
    public void testDeleteUser() {
        Long userId = 1L;
        when(userRepository.existsById(userId)).thenReturn(true);
        assertDoesNotThrow(() -> userService.deleteUser(userId));
    }

    @Test
    public void testExistsByUsername() {
        String username = "existsuser";
        when(userRepository.existsByUsername(username)).thenReturn(true);
        boolean exists = userService.existsByUsername(username);
        assertTrue(exists);
    }

    @Test
    public void testUpdatePassword() {
        Long userId = 1L;
        User user = new User() {
            private String password = "old";

            @Override
            public String getUsername() {
                return "user";
            }

            @Override
            public String getPassword() {
                return password;
            }

            @Override
            public void setPassword(String pw) {
                this.password = pw;
            }
        };
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("newpass")).thenReturn("encoded_newpass");
        when(userRepository.save(any(User.class))).thenReturn(user);
        userService.updatePassword(userId, "newpass");
        assertEquals("encoded_newpass", user.getPassword());
    }
}