package com.playground.camel.controller;

import com.playground.camel.service.DynamicRouteService;
import com.playground.camel.model.InterfaceConfig;
import com.playground.camel.service.InterfaceConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/interfaces")
@CrossOrigin(origins = "*")
public class InterfaceController {

    @Autowired
    private InterfaceConfigService interfaceService;

    @Autowired
    private DynamicRouteService routeService;
    
    @GetMapping
    public ResponseEntity<List<InterfaceConfig>> getAllInterfaces() {
        return ResponseEntity.ok(interfaceService.getAllInterfaces());
    }

    @GetMapping("/{id}")
    public ResponseEntity<InterfaceConfig> getInterfaceById(@PathVariable Long id) {
        Optional<InterfaceConfig> config = interfaceService.getInterfaceById(id);
        return config.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<InterfaceConfig> createInterface(@RequestBody InterfaceConfig config) {
        InterfaceConfig created = interfaceService.createInterface(config);
        if (created.isActive()) {
            routeService.createOrUpdateRoute(created);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<InterfaceConfig> updateInterface(
            @PathVariable Long id,
            @RequestBody InterfaceConfig config) {
    
        return interfaceService.getInterfaceById(id)
                .map(existing -> {
                    config.setId(id);
                    InterfaceConfig updated = interfaceService.updateInterface(config);
                    routeService.createOrUpdateRoute(updated);
                    return ResponseEntity.ok(updated);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInterface(@PathVariable Long id) {
        return interfaceService.getInterfaceById(id)
            .map(existing -> {
                routeService.removeRoute(id);
                interfaceService.deleteInterface(id);
                return ResponseEntity.noContent().<Void>build();
            })
            .orElseGet(() -> ResponseEntity.notFound().build());
}

    @PostMapping("/{id}/activate")
    public ResponseEntity<Void> activateInterface(@PathVariable Long id) {
        return interfaceService.getInterfaceById(id)
                .map(existing -> {
                    interfaceService.activateInterface(id);
                    routeService.createOrUpdateRoute(existing);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivateInterface(@PathVariable Long id) {
        return interfaceService.getInterfaceById(id)
                .map(existing -> {
                    interfaceService.deactivateInterface(id);
                    routeService.removeRoute(id);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
