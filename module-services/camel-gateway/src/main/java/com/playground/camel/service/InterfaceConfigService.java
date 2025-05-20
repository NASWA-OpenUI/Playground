package com.playground.camel.service;

import com.playground.camel.model.InterfaceConfig;
import com.playground.camel.repository.InterfaceConfigRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class InterfaceConfigService {

    @Autowired
    private InterfaceConfigRepository repository;

    public List<InterfaceConfig> getAllInterfaces() {
        return repository.findAll();
    }

    public List<InterfaceConfig> getActiveInterfaces() {
        return repository.findByActive(true);
    }

    public Optional<InterfaceConfig> getInterfaceById(Long id) {
        return repository.findById(id);
    }

    public Optional<InterfaceConfig> getInterfaceByName(String name) {
        return repository.findByName(name);
    }

    public InterfaceConfig createInterface(InterfaceConfig config) {
        config.setCreationDate(LocalDateTime.now());
        config.setLastModified(LocalDateTime.now());
        return repository.save(config);
    }

    public InterfaceConfig updateInterface(InterfaceConfig config) {
        config.setLastModified(LocalDateTime.now());
        return repository.save(config);
    }

    public void deleteInterface(Long id) {
        repository.deleteById(id);
    }

    public void activateInterface(Long id) {
        repository.findById(id).ifPresent(config -> {
            config.setActive(true);
            config.setLastModified(LocalDateTime.now());
            repository.save(config);
        });
    }

    public void deactivateInterface(Long id) {
        repository.findById(id).ifPresent(config -> {
            config.setActive(false);
            config.setLastModified(LocalDateTime.now());
            repository.save(config);
        });
    }
}
