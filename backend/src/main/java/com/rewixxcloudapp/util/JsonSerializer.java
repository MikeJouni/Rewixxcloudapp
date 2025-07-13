package com.rewixxcloudapp.util;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ser.impl.SimpleBeanPropertyFilter;
import com.fasterxml.jackson.databind.ser.impl.SimpleFilterProvider;

import java.util.Arrays;
import java.util.List;

public class JsonSerializer {
    private final ObjectMapper objectMapper;
    private final List<String> includeFields;
    private final List<String> excludeFields;

    public JsonSerializer() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
        this.includeFields = null;
        this.excludeFields = null;
    }

    public JsonSerializer(List<String> includeFields, List<String> excludeFields) {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
        this.includeFields = includeFields;
        this.excludeFields = excludeFields;

        if (includeFields != null || excludeFields != null) {
            SimpleBeanPropertyFilter filter = SimpleBeanPropertyFilter.serializeAllExcept(
                    excludeFields != null ? excludeFields.toArray(new String[0]) : new String[0]);

            SimpleFilterProvider filterProvider = new SimpleFilterProvider()
                    .addFilter("fieldFilter", filter);

            this.objectMapper.setFilterProvider(filterProvider);
        }
    }

    public static JsonSerializer create() {
        return new JsonSerializer();
    }

    public JsonSerializer include(String... fields) {
        return new JsonSerializer(Arrays.asList(fields), this.excludeFields);
    }

    public JsonSerializer exclude(String... fields) {
        return new JsonSerializer(this.includeFields, Arrays.asList(fields));
    }

    public JsonSerializer includeAndExclude(List<String> includeFields, List<String> excludeFields) {
        return new JsonSerializer(includeFields, excludeFields);
    }

    public String serialize(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error serializing object to JSON", e);
        }
    }

    public static String toJsonArray(List<?> objects) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            mapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
            return mapper.writeValueAsString(objects);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error serializing list to JSON", e);
        }
    }

    public static String toJsonArray(List<?> objects, JsonSerializer serializer) {
        try {
            return serializer.objectMapper.writeValueAsString(objects);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error serializing list to JSON", e);
        }
    }
}