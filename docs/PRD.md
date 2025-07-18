# Product Requirements Document: TAK Onboarding Platform

* **Document Version:** 1.0
* **Date:** July 18, 2025
* **Author/Owner:** Product Management
* **Status:** Proposed

### 1. Executive Summary

The Tactical Assault Kit (TAK) ecosystem is a powerful tool for situational awareness, but its effectiveness is often hampered by a slow, error-prone, and manually intensive client configuration process. The **TAK Onboarding Platform** is an offline-first Progressive Web App (PWA) designed to eliminate this friction entirely. By providing a simple, intuitive interface for generating configuration QR codes, the platform enables rapid, reliable, and consistent deployment of TAK clients at any scale—from a single user to a multi-agency mass incident.

The platform currently supports:
- **ATAK Enrollment**: Server connection setup via QR codes for Android devices
- **iTAK Configuration**: Server connection setup via QR codes for iOS devices
- **URL Import**: Data package deployment via QR codes
- **Profile Management**: Save and load configuration sets for quick deployment
- **PWA Support**: Offline-first functionality for field operations

This document outlines the current implementation and future roadmap for evolving into a comprehensive suite of tools for TAK client management.

### 2. The Problem

Onboarding users to a TAK server is a critical point of failure, especially in high-stress environments. The problems manifest at three levels:

* **The Individual User:**
    * **Typo Terror:** Manual entry of long, complex server hostnames, ports, and passwords on mobile devices is a primary source of connection failures.
    * **Cognitive Overload:** Users must remember multi-step processes for importing server profiles and data packages, often leading to missed steps.
    * **Configuration Complexity:** Getting the correct server connection details into the device requires careful typing and verification.

* **The Team Lead / Administrator:**
    * **Onboarding Bottleneck:** Admins waste significant time verbally walking each user through the same setup process, a method that is inefficient and does not scale.
    * **Configuration Drift:** Ensuring every user has the identical, agency-approved configuration (SOPs) is nearly impossible, leading to operational inconsistencies.
    * **Limited Deployment Tools:** Admins lack efficient methods to deploy configurations to multiple users simultaneously.

* **The Mass Incident (Scale):**
    * **Logistical Chaos:** During a mass emergency, attempting to configure hundreds of mutual-aid responders with different configurations (Police, Fire, EMS) creates an unmanageable bottleneck at check-in points.
    * **Role-Based Deployment:** Deploying role-specific configurations (Police, Fire, EMS) requires separate setup processes.

### 3. The Solution & Vision

The TAK Onboarding Platform is a browser-based, serverless PWA that serves as the primary tool for TAK client configuration through QR code generation.

The current implementation allows administrators to:
- Pre-define server connection **Profiles** for different teams
- Generate QR codes for ATAK enrollment (Android)
- Generate QR codes for iTAK configuration (iOS)
- Generate QR codes for data package imports
- Save and manage configuration profiles for quick reuse

In the field, these configurations can be deployed instantly via QR codes displayed on a screen or printed on physical handouts. The end-user experience is reduced to simply pointing their device's camera at a QR code. This transforms the onboarding process from a high-friction, serial task into a frictionless, parallel one.

### 4. Goals & Objectives

| Goal | Objective | Key Performance Indicator (KPI) |
| :--- | :--- | :--- |
| **Increase Speed** | Drastically reduce the time required to configure a TAK client. | Reduce average client configuration time from >5 minutes to <30 seconds. |
| **Improve Reliability** | Eliminate configuration errors caused by manual data entry. | Achieve a >99% success rate for first-time connections using generated QR codes. |
| **Ensure Consistency** | Enable administrators to enforce standard configurations (SOPs) across all users. | 100% of configurations deployed via a Profile will be identical. |
| **Enable Scalability**| Solve the mass onboarding bottleneck at large-scale events. | Enable a single administrator to prepare and deploy configurations for >100 users per hour. |
| **Offline Capability** | Ensure the tool works in austere field environments. | 100% functionality available offline after initial load. |
| **Cross-Platform Support** | Support both ATAK (Android) and iTAK (iOS) clients. | Generate valid QR codes for both platforms. |

### 5. User Personas

* **Chris, the Communications Technician (Primary):**
    * **Role:** Manages communications and technology for a 20-person SAR team.
    * **Goals:** Get his team's devices configured with the correct server and import necessary data packages as quickly as possible. Enforce the team's SOPs through saved profiles.
    * **Frustrations:** Wasting time troubleshooting typos. Team members with different server configurations. Managing both Android and iOS devices.

* **Maria, the Field Responder (Secondary):**
    * **Role:** A paramedic arriving at a mutual-aid incident.
    * **Goals:** Get her device connected to the TAK server quickly so she can see her team and the operational picture.
    * **Frustrations:** Confusing technical instructions. Waiting in line for IT help when she needs to be with her unit. Manual entry of server details.

* **Alex, the IT Administrator (Tertiary):**
    * **Role:** Manages technology infrastructure for a multi-agency emergency response system.
    * **Goals:** Deploy standardized server configurations across different agencies. Ensure security and compliance requirements are met.
    * **Frustrations:** Manual configuration across hundreds of devices. Difficulty maintaining consistent server settings. Lack of tools for mass deployment.

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
    * As Chris, I can create a new, named Profile to store a complete configuration set (ATAK, iTAK, Import URLs).
    * As Chris, I can select a saved Profile to instantly populate all the forms with its data.
    * As Chris, I can edit and update an existing Profile.
    * As Chris, I can delete a Profile I no longer need.

#### Epic 4: Mass Onboarding & Scalability

* **Description:** Tools designed specifically to solve the "100 users in a field" problem.
* **User Stories:**
    * As Chris, I can select one or more saved Profiles and generate a clean, print-friendly HTML document.
    * As Chris, I can see that the generated printout has each Profile on a separate page with a large, clear title (e.g., "FIRE DEPT - CONFIGURATION").
    * As Chris, I can select a single Profile and enter a "Kiosk Mode" that displays its QR codes in a large, high-contrast format suitable for a shared display screen.
    * As Alex, I can generate role-specific configuration packages for different teams (Police, Fire, EMS) with appropriate server settings for each role.

#### Epic 5: PWA & Offline Functionality

* **Description:** The core technical requirement ensuring the tool works in austere environments.
* **User Stories:**
    * As Chris, after visiting the site once with an internet connection, I can open and use the entire application with all its features while completely offline.
    * As Maria, my mobile browser prompts me to "Add to Home Screen," allowing me to launch the tool like a native app.


### 6.1 QR Code Format Compliance

All QR codes generated by the TAK Onboarding Platform must strictly adhere to the official TAK client formats for interoperability and reliability. For the full technical specification, field definitions, and up-to-date examples, see [qr-formats.md](qr-formats.md).

### 6.2 Data Package Integration

The platform will support linking to TAK data packages for comprehensive client configuration. Data packages provide pre-configured settings, certificates, plugins, and map sources. For complete technical specifications on creating and deploying data packages, see [data-packages.md](data-packages.md).


### 6.4 Future Roadmap Considerations

While the current implementation focuses on core QR code generation functionality, future versions may include:

#### 6.4.1 Enhanced QR Code Features
- **Logo Overlay**: Organization logos in QR code centers
- **Custom Colors**: Brand-specific QR code styling
- **Multiple Sizes**: Various export dimensions for different use cases

#### 6.4.2 Deployment Tools
- **Batch Generation**: Multiple QR codes for mass deployment
- **Print Layouts**: Optimized formatting for physical handouts
- **Kiosk Mode**: Large-display presentation for group onboarding

#### 6.4.3 Advanced Profile Management
- **Profile Export/Import**: Share configurations between administrators
- **Role-Based Templates**: Pre-configured profiles for common roles
- **Versioning**: Track configuration changes over time

### 7. User Flow Scenario: Mass Incident Onboarding

1. **Preparation (Day Before):** Chris, the EOC Comms Tech, opens the TAK Onboarding Platform on his laptop. He creates three profiles: "Police," "Fire," and "EMS." For each, he inputs the correct server data and links to the relevant data packages (containing certificates, plugins, and map sources).

2. **Deployment (Day Of):** At the staging area, Chris selects all three profiles and clicks "Generate Handouts." He prints 100 copies of the resulting 3-page document, each containing role-specific QR codes.

3. **Check-in:** He sets up three check-in tables, each with the corresponding stack of handouts.

4. **Onboarding:** Maria, the paramedic, arrives. She is directed to the "EMS" table, where she picks up a handout. She opens her ATAK client, scans the QR codes on the sheet, and in under a minute is connected to the EMS server with the correct maps loaded. She never had to speak to Chris or type anything.

### 8. Release Plan & Roadmap

The project has been developed with a focus on core functionality:

* **Phase 1: MVP - Core Utility (Completed)**
  * **Goal:** Prove the core concept.
  * **Features:** Core QR Generation, Usability improvements, PWA functionality.
  * **Status:** ✅ Complete - All basic QR generation features implemented.

* **Phase 2: Profile Management (Current)**
  * **Goal:** Enable consistency for teams.
  * **Features:** Save/load configuration profiles for quick deployment.
  * **Status:** 🚧 In Progress - Basic profile functionality implemented.

* **Phase 3: Mass Deployment Tools (Future)**
  * **Goal:** Enable large-scale deployments.
  * **Features:** Batch QR generation, print layouts, kiosk mode.
  * **Status:** 📋 Planned - Design phase.


### 9. Out of Scope (Non-Goals)

* This platform will **not** have a server-side backend or require user accounts. All user-generated data (Profiles) is stored locally in the browser.
* This platform will **not** host any files (e.g., data packages). It only links to them or generates them locally.
* This platform will **not** be a native application distributed through the Apple App Store or Google Play Store.
* This platform will **not** directly connect to or manage TAK servers. It only generates configuration data.
* This platform will **not** include real-time collaboration features. All configuration is done locally.

### 10. Assumptions & Dependencies

* **Assumption:** End-users have a functional version of ATAK or iTAK capable of scanning QR codes.
* **Dependency:** The platform's functionality is dependent on the `tak://` URL schema defined by the TAK Product Center. Any changes to this schema may require an update to the tool.
* **Assumption:** Users have basic familiarity with TAK concepts and terminology.
* **Assumption:** Organizations have established TAK server infrastructure.
* **Dependency:** Modern web browser with PWA support for offline functionality.

### 11. Open Questions

* Should the platform support additional TAK client types beyond ATAK and iTAK?
* What is the optimal QR code size for field deployment scenarios?
* Should profile data be exportable for backup/sharing purposes?
* How can we best support multi-agency deployments with different server configurations?
* What additional data package types should be supported for URL imports?