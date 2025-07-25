package com.rewixxcloudapp.entity;

import com.rewixxcloudapp.util.JsonSerializer;
import javax.persistence.*;
import java.util.Collection;

@Entity
@Table(name = "customers")
public class Customer extends User {

    private String name;

    public Customer() {
        super();
    }

    public Customer(String username, String password, String name) {
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
        return Customer.serializer().serialize(this);
    }

    public static String toJsonArray(Collection<Customer> customers) {
        return JsonSerializer.toJsonArray(customers, Customer.serializer());
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}