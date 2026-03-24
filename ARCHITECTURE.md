# Architecture & Project Plan: The Art Museum App

This document outlines the product backlog, architecture, and "Secured by Design" principles for building "The Art Museum" mobile application, based on the provided prototype images.

## 1. Core Principles: Secured by Design

Before writing any code, the architecture must integrate security at every layer. This app handles sensitive user data (passwords, PII) and financial transactions (shop, tickets, memberships), requiring strict adherence to security best practices (e.g., OWASP Mobile Top 10, PCI-DSS).

*   **Never Trust the Client:** All business logic, price calculations, and authorization checks must occur on the backend.
*   **Defense in Depth:** Multiple layers of security controls (WAF, API Gateway, Application Logic, Database Encryption).
*   **Least Privilege:** Services, databases, and users should only have the minimum permissions necessary.
*   **Secure Defaults:** Features should be secure out-of-the-box (e.g., strong password requirements, secure headers, encrypted storage).
*   **Zero Trust Architecture:** Strict identity verification for every person and device trying to access resources.

---

## 2. System Architecture

*   **Mobile Frontend:** React Native (Expo) - Cross-platform (iOS/Android).
*   **Backend API:** Node.js with Express or NestJS (REST or GraphQL) hosted on a secure cloud provider (AWS/GCP).
*   **Database:** PostgreSQL (Relational data: Users, Orders, Tickets) + Redis (Session management, caching).
*   **Authentication Identity Provider (IdP):** Auth0 or AWS Cognito (Offloading complex auth logic to hardened third-party services).
*   **Payment Gateway:** Stripe (Handles PCI compliance via tokenization).
*   **Media Storage:** AWS S3 with CloudFront CDN (for artwork and exhibition images).

---

## 3. Product Backlog & Work Mapping

### Epic 1: Identity & Access Management (Image 1)
*   **User Story:** As a user, I want to securely create an account and log in so I can manage my memberships, tickets, and shop orders.
*   **Tasks:**
    *   Setup Auth0/Cognito tenant.
    *   Build Login/Registration UI.
    *   Implement "Forgot Password" flow with secure email links.
    *   **Security Tasks:**
        *   Implement biometric authentication (FaceID/TouchID) for app unlock.
        *   Ensure JWTs have short expirations and implement secure refresh token rotation.
        *   Store access/refresh tokens in secure enclaves (iOS Keychain / Android Keystore) - DO NOT use plain `AsyncStorage`.
        *   Implement strict rate-limiting on login/registration API endpoints to prevent brute-force attacks.
        *   Enforce strong password policies (length, complexity, dictionary checks).

### Epic 2: Main Navigation & Discovery (Images 2, 3)
*   **User Story:** As a user, I want to navigate the app and view featured exhibitions and museum hours on the home screen.
*   **Tasks:**
    *   Implement Side Drawer Navigation Menu.
    *   Build Home Screen UI (Featured banner, quick links, location/hours).
    *   Implement Global Search functionality.
    *   **Security Tasks:**
        *   Implement input sanitization and parameterized queries for the Search API to prevent SQL Injection and XSS.
        *   Enforce TLS 1.2+ (preferably TLS 1.3) with certificate pinning for all mobile-to-API communication to prevent Man-in-the-Middle (MitM) attacks.

### Epic 3: Exhibitions, Artists & Collections (Images 4, 6)
*   **User Story:** As a user, I want to browse collections, view exhibition details, and read artist biographies.
*   **Tasks:**
    *   Build Exhibition details page (image carousel, dates, description).
    *   Build Collections grid view with category filtering.
    *   Setup CDN for optimized image delivery.
    *   **Security Tasks:**
        *   Ensure APIs serving public catalog data implement rate limiting to prevent scraping/DDoS.
        *   Validate all image URLs to prevent Server-Side Request Forgery (SSRF) if the app ever fetches external images.

### Epic 4: E-Commerce / Shop (Image 5)
*   **User Story:** As a user, I want to view merchandise and add items to my cart.
*   **Tasks:**
    *   Build Product Details page (price, variations, "Add to Cart").
    *   Implement persistent Cart state.
    *   Implement "Member Price" calculation logic.
    *   **Security Tasks:**
        *   **CRITICAL:** All price calculations and discount logic MUST happen on the backend. The client only sends the Product ID; the server determines the price.
        *   Validate inventory levels atomically on the backend during the "Add to Cart" and "Checkout" phases to prevent race conditions.

### Epic 5: Ticketing & Booking (Image 7)
*   **User Story:** As a user, I want to select a date and purchase admission tickets for various age groups.
*   **Tasks:**
    *   Build Ticket selection UI (Date picker, counter for Adults/Seniors/Students).
    *   Calculate running total dynamically.
    *   **Security Tasks:**
        *   Similar to the shop, validate ticket prices and availability server-side.
        *   Implement secure booking locks (e.g., reserve tickets for 10 minutes during checkout) using Redis.

### Epic 6: Memberships (Image 8)
*   **User Story:** As a user, I want to view membership tiers and purchase a membership to get benefits like free entry and shop discounts.
*   **Tasks:**
    *   Build Membership selection UI (Individual, Dual, Supporter).
    *   Implement logic to apply membership status to user accounts post-purchase.
    *   **Security Tasks:**
        *   Implement robust Role-Based Access Control (RBAC). When a membership is purchased, the backend must securely upgrade the user's role and issue a new JWT reflecting those permissions.

### Epic 7: Payment Processing & Checkout (Images 5, 7, 8)
*   **User Story:** As a user, I want to securely pay for my tickets, shop items, or membership using my credit card or Apple/Google Pay.
*   **Tasks:**
    *   Integrate Stripe React Native SDK.
    *   Build generic checkout flow.
    *   Implement Stripe Webhooks on the backend to fulfill orders upon successful payment.
    *   **Security Tasks:**
        *   **PCI-DSS Compliance:** The app MUST NOT handle raw credit card numbers. Use Stripe Elements/SDK to tokenize card data directly to Stripe.
        *   Backend must verify Stripe Webhook signatures to prevent spoofed payment confirmations.
        *   Use Idempotency Keys for all payment creation requests to prevent duplicate charges on network retries.

### Epic 8: Infrastructure & DevSecOps
*   **Tasks:**
    *   Setup CI/CD pipelines (GitHub Actions).
    *   Provision cloud infrastructure using Infrastructure as Code (Terraform).
    *   **Security Tasks:**
        *   Integrate SAST (Static Application Security Testing) and SCA (Software Composition Analysis) tools into the CI/CD pipeline to catch vulnerabilities in code and dependencies before merging.
        *   Use Secrets Management (e.g., AWS Secrets Manager, .env files NEVER committed to source control) for API keys and database credentials.
        *   Encrypt databases at rest (AES-256) and enforce encrypted connections (SSL/TLS) between backend services and the database.
        *   Implement a Web Application Firewall (WAF) in front of the backend API.
        *   Configure structured logging and monitoring (e.g., Datadog, ELK stack) with alerting for suspicious activity (e.g., multiple failed logins, payment failures), ensuring PII/passwords are stripped from logs.

---
