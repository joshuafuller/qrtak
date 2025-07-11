# Product Requirements Document: TAK Onboarding Platform

* **Document Version:** 0.2
* **Date:** July 10, 2025
* **Author/Owner:** Product Management
* **Status:** Proposed

### 1. Executive Summary

The Tactical Assault Kit (TAK) ecosystem is a powerful tool for situational awareness, but its effectiveness is often hampered by a slow, error-prone, and manually intensive client configuration process. The **TAK Onboarding Platform** will be an offline-first Progressive Web App (PWA) designed to eliminate this friction entirely. By providing a simple, intuitive interface for generating configuration QR codes and comprehensive preference management, the platform will enable rapid, reliable, and consistent deployment of TAK clients at any scale—from a single user to a multi-agency mass incident.

The platform will support the full spectrum of ATAK configuration capabilities, including:
- **Basic Enrollment**: Server connection setup via QR codes
- **Advanced Preferences**: Complete access to 711+ ATAK preference keys across 9 categories
- **Data Package Generation**: Create comprehensive deployment packages
- **Template Management**: Pre-built and custom configuration templates
- **Mass Deployment**: Bulk generation for large-scale operations

This document outlines the vision, features, and phased rollout plan, starting with a core utility MVP and evolving into a comprehensive suite of tools for complete TAK client management.

### 2. The Problem

Onboarding users to a TAK server is a critical point of failure, especially in high-stress environments. The problems manifest at three levels:

* **The Individual User:**
    * **Typo Terror:** Manual entry of long, complex server hostnames, ports, and passwords on mobile devices is a primary source of connection failures.
    * **Cognitive Overload:** Users must remember multi-step processes for importing server profiles, data packages, and setting preferences, often leading to missed steps.
    * **Preference Complexity:** ATAK offers 711+ configurable preferences across 9 categories, but users lack tools to easily discover, configure, and deploy these settings.

* **The Team Lead / Administrator:**
    * **Onboarding Bottleneck:** Admins waste significant time verbally walking each user through the same setup process, a method that is inefficient and does not scale.
    * **Configuration Drift:** Ensuring every user has the identical, agency-approved configuration (SOPs) is nearly impossible, leading to operational inconsistencies.
    * **Limited Configuration Control:** Admins struggle to enforce standardized preferences across teams, leading to inconsistent user experiences and operational inefficiencies.

* **The Mass Incident (Scale):**
    * **Logistical Chaos:** During a mass emergency, attempting to configure hundreds of mutual-aid responders with different configurations (Police, Fire, EMS) creates an unmanageable bottleneck at check-in points.
    * **Preference Management:** Deploying role-specific configurations with appropriate preferences becomes impossible without proper tools.

### 3. The Solution & Vision

The TAK Onboarding Platform will be a browser-based, serverless PWA that acts as the single source of truth for complete client configuration, from basic enrollment to advanced preference management.

Our vision is to create a comprehensive tool where an administrator can, in a calm environment, pre-define complete configuration **Profiles** for different teams, including:
- Basic server enrollment settings
- Advanced ATAK preferences (identity, display, network, GPS, communication, tools, navigation, notifications, system)
- Data package configurations
- Role-specific templates

In the field, these profiles can be deployed instantly and in parallel via QR codes displayed on a screen or, more effectively, printed on physical handouts. The end-user experience will be reduced to simply pointing their device's camera at a piece of paper. This transforms the onboarding process from a high-friction, serial task into a frictionless, parallel one, ensuring every responder gets online quickly and with the correct configuration.

### 4. Goals & Objectives

| Goal | Objective | Key Performance Indicator (KPI) |
| :--- | :--- | :--- |
| **Increase Speed** | Drastically reduce the time required to configure a TAK client. | Reduce average client configuration time from >5 minutes to <30 seconds. |
| **Improve Reliability** | Eliminate configuration errors caused by manual data entry. | Achieve a >99% success rate for first-time connections using generated QR codes. |
| **Ensure Consistency** | Enable administrators to enforce standard configurations (SOPs) across all users. | 100% of configurations deployed via a Profile will be identical. |
| **Enable Scalability**| Solve the mass onboarding bottleneck at large-scale events. | Enable a single administrator to prepare and deploy configurations for >100 users per hour. |
| **Comprehensive Configuration** | Provide access to all ATAK preference capabilities. | Support 100% of documented ATAK preference keys across all categories. |
| **User-Friendly Preference Management** | Simplify complex ATAK preference configuration. | Enable non-technical users to configure advanced ATAK settings without memorizing preference keys. |

### 5. User Personas

* **Chris, the Communications Technician (Primary):**
    * **Role:** Manages communications and technology for a 20-person SAR team.
    * **Goals:** Get his team's devices configured with the correct server, maps, team settings, and advanced preferences as quickly as possible. Enforce the team's SOPs and ensure consistent user experience.
    * **Frustrations:** Wasting time troubleshooting typos. Team members with inconsistent settings. Difficulty configuring advanced ATAK preferences without technical expertise.

* **Maria, the Field Responder (Secondary):**
    * **Role:** A paramedic arriving at a mutual-aid incident.
    * **Goals:** Get her device working so she can see her team and the operational picture with optimal settings for her role.
    * **Frustrations:** Confusing technical instructions. Waiting in line for IT help when she needs to be with her unit. Inconsistent interface settings across devices.

* **Alex, the IT Administrator (Tertiary):**
    * **Role:** Manages technology infrastructure for a multi-agency emergency response system.
    * **Goals:** Deploy standardized configurations across different agencies while maintaining role-specific customizations. Ensure security and compliance requirements are met.
    * **Frustrations:** Manual preference configuration across hundreds of devices. Difficulty maintaining configuration standards. Lack of tools for enterprise-scale deployment.

### 6. Features & Requirements

#### Epic 1: Core QR Generation Engine

* **Description:** The fundamental ability to generate QR codes from user input.
* **User Stories:**
    * As Chris, I can input a host, username, and token to generate an ATAK `enroll` QR code.
    * As Chris, I can input a URL to generate a URL-encoded ATAK `import` QR code.
    * As Chris, I can input a server description, URL, port, and protocol to generate an iTAK configuration QR code.

#### Epic 2: Usability & Workflow

* **Description:** Features that make the tool easy and efficient to use.
* **User Stories:**
    * As Chris, I can see the QR code update in real-time as I type in the forms.
    * As Maria, I can easily download the generated QR code as a PNG image to my device.
    * As Chris, I can copy the raw `tak://` URI to the clipboard for pasting into other documents.
    * As Maria, I can clearly see a prominent warning about the security risks of putting a password in a QR code.

#### Epic 3: Profile & SOP Management

* **Description:** The core feature for enabling consistency and pre-planning. All data is stored in the browser's local storage.
* **User Stories:**
    * As Chris, I can create a new, named Profile to store a complete configuration set (ATAK, iTAK, Import URLs, Preferences).
    * As Chris, I can select a saved Profile to instantly populate all the forms with its data.
    * As Chris, I can edit and update an existing Profile.
    * As Chris, I can delete a Profile I no longer need.
    * As Chris, I can use a "Human-Friendly" form (e.g., dropdown menus for 'Team Color') to add ATAK preferences to a Profile, without needing to know the raw preference keys.

#### Epic 4: Comprehensive Preference Editor

* **Description:** Advanced preference management system providing access to all 711+ ATAK preference keys across 9 categories with user-friendly interfaces and validation.
* **User Stories:**
    * As Chris, I can browse ATAK preferences by category (Identity, Display, Network, GPS, Communication, Tools, Navigation, Notifications, System) to find the settings I need.
    * As Chris, I can search for specific preferences by name or description without knowing the exact preference key.
    * As Chris, I can see real-time validation of preference values as I configure them, preventing configuration errors.
    * As Chris, I can add multiple preferences to a configuration and see them all reflected in a single QR code or data package.
    * As Alex, I can use pre-built templates (Fire Department, Police, EMS, Military, SAR) that include role-appropriate preference configurations.
    * As Chris, I can create and save custom preference templates for my team's specific needs.
    * As Chris, I can see a preview of how my preference configuration will affect the ATAK user interface.
    * As Alex, I can generate data packages that include comprehensive preference configurations along with certificates and other resources.
    * As Chris, I can validate that my preference configuration is compatible with my target ATAK version.
    * As Chris, I can see warnings when I approach QR code size limits and get suggestions for optimization.

#### Epic 5: Mass Onboarding & Scalability

* **Description:** Tools designed specifically to solve the "100 users in a field" problem.
* **User Stories:**
    * As Chris, I can select one or more saved Profiles and generate a clean, print-friendly HTML document.
    * As Chris, I can see that the generated printout has each Profile on a separate page with a large, clear title (e.g., "FIRE DEPT - CONFIGURATION").
    * As Chris, I can select a single Profile and enter a "Kiosk Mode" that displays its QR codes in a large, high-contrast format suitable for a shared display screen.
    * As Alex, I can generate role-specific configuration packages for different teams (Police, Fire, EMS) with appropriate preference settings for each role.

#### Epic 6: PWA & Offline Functionality

* **Description:** The core technical requirement ensuring the tool works in austere environments.
* **User Stories:**
    * As Chris, after visiting the site once with an internet connection, I can open and use the entire application with all its features while completely offline.
    * As Maria, my mobile browser prompts me to "Add to Home Screen," allowing me to launch the tool like a native app.

### 6.1 QR Code Format Compliance

All QR codes generated by the TAK Onboarding Platform must strictly adhere to the official TAK client formats for interoperability and reliability. For the full technical specification, field definitions, and up-to-date examples, see [docs/qr-formats.md](qr-formats.md).

### 6.2 Data Package Integration

The platform will support linking to TAK data packages for comprehensive client configuration. Data packages provide pre-configured settings, certificates, plugins, and map sources. For complete technical specifications on creating and deploying data packages, see [docs/data-packages.md](data-packages.md).

### 6.3 Preference Key Compliance

The platform will support all documented ATAK preference keys as specified in the [ATAK Preference Keys Technical Specification](ATAK-Preference-Keys-Technical-Specification.md). This includes:
- 711+ preference keys across 9 categories
- Full data type support (string, boolean, integer, long)
- Validation patterns and value constraints
- Real-time validation and error checking
- Compatibility checking for different ATAK versions

### 7. User Flow Scenario: Mass Incident Onboarding

1.  **Preparation (Day Before):** Chris, the EOC Comms Tech, opens the TAK Onboarding Platform on his laptop. He creates three profiles: "Police," "Fire," and "EMS." For each, he inputs the correct server data and links to the relevant data packages (containing certificates, plugins, and map sources). Using the preference editor, he configures role-specific settings:
    - **Fire Profile**: Team color set to 'Red', role set to 'Team Lead', coordinate display set to 'UTM', large text mode enabled for field visibility
    - **Police Profile**: Team color set to 'Blue', role set to 'Team Member', GPS set to 'WRGPS' for external GPS support, location reporting set to 'Dynamic'
    - **EMS Profile**: Team color set to 'Green', role set to 'Medic', communication preferences configured for emergency response, notification settings optimized for medical operations

2.  **Deployment (Day Of):** At the staging area, Chris selects all three profiles and clicks "Generate Handouts." He prints 100 copies of the resulting 3-page document, each containing role-specific QR codes with comprehensive preference configurations.

3.  **Check-in:** He sets up three check-in tables, each with the corresponding stack of handouts.

4.  **Onboarding:** Maria, the paramedic, arrives. She is directed to the "EMS" table, where she picks up a handout. She opens her ATAK client, scans the QR codes on the sheet, and in under a minute is connected to the EMS server with the correct maps loaded and all preferences optimized for medical response operations. She never had to speak to Chris or type anything.

### 8. Release Plan & Roadmap

The project will be developed in phases to deliver value quickly and incorporate feedback.

* **Phase 1: MVP - Core Utility (Target: Q3 2025)**
    * **Goal:** Prove the core concept.
    * **Features:** Epic 1 (Core QR Generation), Epic 2 (Usability), Epic 6 (PWA).

* **Phase 2: Team & SOP Management (Target: Q4 2025)**
    * **Goal:** Enable consistency for teams.
    * **Features:** Epic 3 (Profile Management & Basic Preferences).

* **Phase 3: Comprehensive Preference Management (Target: Q1 2026)**
    * **Goal:** Provide complete ATAK configuration capabilities.
    * **Features:** Epic 4 (Comprehensive Preference Editor), Advanced Data Package Generation.

* **Phase 4: Mass Onboarding & Scalability (Target: Q2 2026)**
    * **Goal:** Solve the large-scale deployment problem.
    * **Features:** Epic 5 (Bulk Print Handouts & Kiosk Mode), Enterprise Templates.

### 9. Out of Scope (Non-Goals)

* This platform will **not** have a server-side backend or require user accounts. All user-generated data (Profiles) is stored locally in the browser.
* This platform will **not** host any files (e.g., data packages). It only links to them or generates them locally.
* This platform will **not** be a native application distributed through the Apple App Store or Google Play Store.
* This platform will **not** directly connect to or manage TAK servers. It only generates configuration data.
* This platform will **not** include real-time collaboration features. All configuration is done locally.

### 10. Assumptions & Dependencies

* **Assumption:** End-users have a functional version of ATAK or iTAK capable of scanning QR codes.
* **Dependency:** The platform's functionality is dependent on the `tak://` URL schema defined by the TAK Product Center. Any changes to this schema may require an update to the tool.
* **Dependency:** The platform relies on the ATAK Preference Keys Technical Specification for preference definitions and validation rules.
* **Assumption:** Users have basic familiarity with ATAK concepts and terminology.

### 11. Open Questions

* What are the top 10 most critical/common preferences that should be highlighted in the preference editor interface?
* Should a "dark mode" theme be prioritized for low-light/field environments?
* What level of preference validation should be performed client-side vs. relying on ATAK's built-in validation?
* How should the platform handle deprecated or version-specific preference keys?
* What security considerations should be addressed for preference configurations that might contain sensitive information?