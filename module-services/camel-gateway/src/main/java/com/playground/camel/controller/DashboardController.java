package com.playground.camel.controller;

import com.playground.camel.service.ClaimService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class DashboardController {

    @Autowired
    private ClaimService claimService;

    @GetMapping("/")
    public String dashboard(Model model) {
        // Add claims count for the main dashboard
        try {
            long totalClaims = claimService.getAllClaims().size();
            model.addAttribute("totalClaims", totalClaims);
        } catch (Exception e) {
            model.addAttribute("totalClaims", 0);
        }
        return "dashboard";
    }

    @GetMapping("/dashboard")
    public String dashboardAlias(Model model) {
        return dashboard(model);
    }
 
    @GetMapping("/graphql-tester")
    public String graphqlTester(Model model) {
        return "graphql-tester";
    }

    @GetMapping("/claims")
    public String claimsPage(Model model) {
        return "claims-dashboard";
    }
}