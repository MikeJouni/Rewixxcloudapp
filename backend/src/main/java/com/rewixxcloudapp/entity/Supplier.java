package com.rewixxcloudapp.entity;

import com.rewixxcloudapp.util.JsonSerializer;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import javax.persistence.*;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Entity
@Table(name = "suppliers")
public class Supplier extends User {

    private String name;

    public Supplier() {
        super();
    }

    public Supplier(String username, String password, String name) {
        super(username, password);
        this.name = name;
    }

    // JSON Serialization methods
    private static JsonSerializer serializer() {
        return JsonSerializer.create()
                .include("id", "username", "enabled", "phone", "addressLine1", "addressLine2",
                        "city", "state", "zip", "name", "roles.id", "roles.name")
                .exclude("*");
    }

    @Override
    public String toJson() {
        return Supplier.serializer().serialize(this);
    }

    public static String toJsonArray(List<Supplier> suppliers) {
        return JsonSerializer.toJsonArray(suppliers, Supplier.serializer());
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}