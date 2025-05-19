package com.playground.camel.controller;

import com.playground.camel.monitoring.HealthMonitor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class DashboardController {

    @Autowired
    private HealthMonitor healthMonitor;

    @GetMapping("/")
    public String dashboard(Model model) {
        return "dashboard";
    }

    @GetMapping("/api/health/services")
    @ResponseBody
    public String getServiceStatus() throws Exception {
        return healthMonitor.getCurrentStatus();
    }
}