# ATAK Data Package Templates

## Overview

This document provides complete templates and examples for creating ATAK data packages for configuration and enrollment. These templates can be used as starting points for different deployment scenarios.

## Document Version
- **Version**: 0.1
- **Date**: July 10, 2025
- **Compatibility**: ATAK 5.1+, iTAK, WinTAK

## Table of Contents

1. [Basic Requirements](#basic-requirements)
2. [Soft-Certificate Deployment](#soft-certificate-deployment)
3. [Certificate Auto-Enrollment Deployment](#certificate-auto-enrollment-deployment)
4. [iTAK Deployment](#itak-deployment)
5. [Advanced Configurations](#advanced-configurations)
6. [Template Files](#template-files)
7. [Deployment Checklist](#deployment-checklist)

## Basic Requirements

### File Structure

```
dataPackage/
├── certs/
│   ├── config.pref
│   ├── caCert.p12
│   └── clientCert.p12 (soft-cert only)
├── MANIFEST/
│   └── MANIFEST.xml
├── plugins/ (optional)
└── maps/ (optional)
```

### Required Components

1. **config.pref**: XML preference file containing server and user configuration
2. **MANIFEST.xml**: Package manifest defining structure and metadata
3. **caCert.p12**: Certificate Authority certificate
4. **clientCert.p12**: Client certificate (soft-cert only)

## Soft-Certificate Deployment

### Complete Template

#### config.pref
```xml
<?xml version='1.0' encoding='ASCII' standalone='yes'?>
<preferences>
  <preference version="1" name="cot_streams">
    <entry key="count" class="class java.lang.Integer">1</entry>
    <entry key="description0" class="class java.lang.String">TAK Server</entry>
    <entry key="enabled0" class="class java.lang.Boolean">true</entry>
    <entry key="connectString0" class="class java.lang.String">TAKSERVER:8089:ssl</entry>
  </preference>
  <preference version="1" name="com.atakmap.app_preferences">
    <entry key="displayServerConnectionWidget" class="class java.lang.Boolean">true</entry>
    <entry key="caLocation" class="class java.lang.String">cert/caCert.p12</entry>
    <entry key="caPassword" class="class java.lang.String">PASSWORD</entry>
    <entry key="clientPassword" class="class java.lang.String">PASSWORD</entry>
    <entry key="certificateLocation" class="class java.lang.String">cert/clientCert.p12</entry>
    <entry key="locationCallsign" class="class java.lang.String">CALLSIGN</entry>
    <entry key="locationTeam" class="class java.lang.String">Green</entry>
    <entry key="atakRoleType" class="class java.lang.String">Team Lead</entry>
    <entry key="coord_display_pref" class="class java.lang.String">MGRS</entry>
    <entry key="alt_display_pref" class="class java.lang.String">HAE</entry>
    <entry key="alt_unit_pref" class="class java.lang.String">0</entry>
    <entry key="dispatchLocationCotExternal" class="class java.lang.Boolean">true</entry>
    <entry key="enableNonStreamingConnections" class="class java.lang.Boolean">false</entry>
    <entry key="largeTextMode" class="class java.lang.Boolean">false</entry>
    <entry key="map_zoom_visible" class="class java.lang.Boolean">true</entry>
    <entry key="map_scale_visible" class="class java.lang.Boolean">true</entry>
  </preference>
</preferences>
```

#### MANIFEST.xml
```xml
<MissionPackageManifest version="2">
  <Configuration>
    <Parameter name="uid" value="a647112f-ce05-4312-a2b4-208d8d8a5fa8"/>
    <Parameter name="name" value="TAK_Server.zip"/>
    <Parameter name="onReceiveDelete" value="true"/>
  </Configuration>
  <Contents>
    <Content ignore="false" zipEntry="certs/config.pref"/>
    <Content ignore="false" zipEntry="certs/caCert.p12"/>
    <Content ignore="false" zipEntry="certs/clientCert.p12"/>
  </Contents>
</MissionPackageManifest>
```

### Configuration Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `TAKSERVER` | TAK Server hostname or IP | `tak.example.com` |
| `PASSWORD` | Certificate password | `MySecurePassword123` |
| `CALLSIGN` | User callsign | `ALPHA-01` |
| `uid` | Unique package identifier | Generate at https://www.uuidgenerator.net/ |

## Certificate Auto-Enrollment Deployment

### Complete Template

#### config.pref
```xml
<?xml version='1.0' encoding='ASCII' standalone='yes'?>
<preferences>
  <preference version="1" name="cot_streams">
    <entry key="count" class="class java.lang.Integer">1</entry>
    <entry key="description0" class="class java.lang.String">TAK Server</entry>
    <entry key="enabled0" class="class java.lang.Boolean">true</entry>
    <entry key="connectString0" class="class java.lang.String">TAKSERVER:8089:ssl</entry>
    <entry key="caLocation0" class="class java.lang.String">cert/caCert.p12</entry>
    <entry key="caPassword0" class="class java.lang.String">PASSWORD</entry>
    <entry key="enrollForCertificateWithTrust0" class="class java.lang.Boolean">true</entry>
    <entry key="useAuth0" class="class java.lang.Boolean">true</entry>
    <entry key="cacheCreds0" class="class java.lang.String">Cache credentials</entry>
  </preference>
  <preference version="1" name="com.atakmap.app_preferences">
    <entry key="displayServerConnectionWidget" class="class java.lang.Boolean">true</entry>
    <entry key="locationCallsign" class="class java.lang.String">CALLSIGN</entry>
    <entry key="locationTeam" class="class java.lang.String">Blue</entry>
    <entry key="atakRoleType" class="class java.lang.String">Team Member</entry>
    <entry key="coord_display_pref" class="class java.lang.String">UTM</entry>
    <entry key="alt_display_pref" class="class java.lang.String">HAE</entry>
    <entry key="alt_unit_pref" class="class java.lang.String">1</entry>
    <entry key="dispatchLocationCotExternal" class="class java.lang.Boolean">true</entry>
    <entry key="enableNonStreamingConnections" class="class java.lang.Boolean">false</entry>
    <entry key="largeTextMode" class="class java.lang.Boolean">false</entry>
    <entry key="map_zoom_visible" class="class java.lang.Boolean">true</entry>
    <entry key="map_scale_visible" class="class java.lang.Boolean">true</entry>
  </preference>
</preferences>
```

#### MANIFEST.xml
```xml
<MissionPackageManifest version="2">
  <Configuration>
    <Parameter name="uid" value="a647112f-ce05-4312-a2b4-208d8d8a5fa8"/>
    <Parameter name="name" value="TAK_Server.zip"/>
    <Parameter name="onReceiveDelete" value="true"/>
  </Configuration>
  <Contents>
    <Content ignore="false" zipEntry="certs/config.pref"/>
    <Content ignore="false" zipEntry="certs/caCert.p12"/>
  </Contents>
</MissionPackageManifest>
```

## iTAK Deployment

### File Structure
```
iTAK_Package.zip
├── config.pref
├── caCert.p12
└── clientCert.p12 (soft-cert only)
```

### config.pref Template

**⚠️ Important**: iTAK uses a different path handling mechanism. Even though certificate files are placed at the root level of the package, the config.pref must still reference them using `cert/` paths. ATAK automatically handles the path mapping for iTAK packages.

```xml
<?xml version='1.0' standalone='yes'?>
<preferences>
  <preference version="1" name="cot_streams">
    <entry key="count" class="class java.lang.Integer">1</entry>
    <entry key="description0" class="class java.lang.String">TAK Server</entry>
    <entry key="enabled0" class="class java.lang.Boolean">true</entry>
    <entry key="connectString0" class="class java.lang.String">TAKSERVER:8089:ssl</entry>
  </preference>
  <preference version="1" name="com.atakmap.app_preferences">
    <entry key="displayServerConnectionWidget" class="class java.lang.Boolean">true</entry>
    <entry key="caLocation" class="class java.lang.String">cert/caCert.p12</entry>
    <entry key="caPassword" class="class java.lang.String">PASSWORD</entry>
    <entry key="clientPassword" class="class java.lang.String">PASSWORD</entry>
    <entry key="certificateLocation" class="class java.lang.String">cert/clientCert.p12</entry>
  </preference>
</preferences>
```

## Advanced Configurations

### Including Plugins and Maps

#### MANIFEST.xml with Additional Resources
```xml
<MissionPackageManifest version="2">
  <Configuration>
    <Parameter name="uid" value="a647112f-ce05-4312-a2b4-208d8d8a5fa8"/>
    <Parameter name="name" value="TAK_Server_Complete.zip"/>
    <Parameter name="onReceiveDelete" value="true"/>
  </Configuration>
  <Contents>
    <Content ignore="false" zipEntry="certs/config.pref"/>
    <Content ignore="false" zipEntry="certs/caCert.p12"/>
    <Content ignore="false" zipEntry="certs/clientCert.p12"/>
    <Content ignore="false" zipEntry="maps/sGoogleMaps.xml"/>
    <Content ignore="false" zipEntry="maps/sBingMaps.xml"/>
    <Content ignore="false" zipEntry="plugins/DataSync-1.1.0.0-4.7.0.163"/>
    <Content ignore="false" zipEntry="plugins/TAKChat-1.0.0.0-4.7.0.163"/>
  </Contents>
</MissionPackageManifest>
```

### Enterprise Lockdown Configuration

#### config.pref with Hidden Preferences
```xml
<?xml version='1.0' encoding='ASCII' standalone='yes'?>
<preferences>
  <preference version="1" name="cot_streams">
    <entry key="count" class="class java.lang.Integer">1</entry>
    <entry key="description0" class="class java.lang.String">TAK Server</entry>
    <entry key="enabled0" class="class java.lang.Boolean">true</entry>
    <entry key="connectString0" class="class java.lang.String">TAKSERVER:8089:ssl</entry>
  </preference>
  <preference version="1" name="com.atakmap.app_preferences">
    <entry key="displayServerConnectionWidget" class="class java.lang.Boolean">true</entry>
    <entry key="caLocation" class="class java.lang.String">cert/caCert.p12</entry>
    <entry key="caPassword" class="class java.lang.String">PASSWORD</entry>
    <entry key="clientPassword" class="class java.lang.String">PASSWORD</entry>
    <entry key="certificateLocation" class="class java.lang.String">cert/clientCert.p12</entry>
    <entry key="locationCallsign" class="class java.lang.String">CALLSIGN</entry>
    <entry key="locationTeam" class="class java.lang.String">Green</entry>
    <entry key="atakRoleType" class="class java.lang.String">Team Lead</entry>
    
    <!-- Hidden Preferences -->
    <entry key="hidePreferenceItem_locationCallsign" class="class java.lang.Boolean">true</entry>
    <entry key="hidePreferenceItem_networkGpsCategory" class="class java.lang.Boolean">true</entry>
    <entry key="hidePreferenceItem_bluetooth_preferences_category" class="class java.lang.Boolean">true</entry>
    <entry key="hidePreferenceItem_advanced_network_settings" class="class java.lang.Boolean">true</entry>
  </preference>
</preferences>
```

### Multiple Server Configuration

#### config.pref with Multiple Servers
```xml
<?xml version='1.0' encoding='ASCII' standalone='yes'?>
<preferences>
  <preference version="1" name="cot_streams">
    <entry key="count" class="class java.lang.Integer">2</entry>
    <entry key="description0" class="class java.lang.String">Primary TAK Server</entry>
    <entry key="enabled0" class="class java.lang.Boolean">true</entry>
    <entry key="connectString0" class="class java.lang.String">PRIMARY_SERVER:8089:ssl</entry>
    <entry key="description1" class="class java.lang.String">Secondary TAK Server</entry>
    <entry key="enabled1" class="class java.lang.Boolean">true</entry>
    <entry key="connectString1" class="class java.lang.String">SECONDARY_SERVER:8089:ssl</entry>
  </preference>
  <preference version="1" name="com.atakmap.app_preferences">
    <entry key="displayServerConnectionWidget" class="class java.lang.Boolean">true</entry>
    <entry key="caLocation" class="class java.lang.String">cert/caCert.p12</entry>
    <entry key="caPassword" class="class java.lang.String">PASSWORD</entry>
    <entry key="clientPassword" class="class java.lang.String">PASSWORD</entry>
    <entry key="certificateLocation" class="class java.lang.String">cert/clientCert.p12</entry>
    <entry key="locationCallsign" class="class java.lang.String">CALLSIGN</entry>
    <entry key="locationTeam" class="class java.lang.String">Green</entry>
    <entry key="atakRoleType" class="class java.lang.String">Team Lead</entry>
  </preference>
</preferences>
```

## Template Files

### Basic Soft-Certificate Package

**File: `soft-cert-basic.zip`**
- `certs/config.pref` - Basic configuration
- `certs/caCert.p12` - CA certificate
- `certs/clientCert.p12` - Client certificate
- `MANIFEST/MANIFEST.xml` - Package manifest

### Auto-Enrollment Package

**File: `auto-enroll-basic.zip`**
- `certs/config.pref` - Auto-enrollment configuration
- `certs/caCert.p12` - CA certificate
- `MANIFEST/MANIFEST.xml` - Package manifest

### Complete Package with Resources

**File: `complete-package.zip`**
- `certs/config.pref` - Full configuration
- `certs/caCert.p12` - CA certificate
- `certs/clientCert.p12` - Client certificate
- `MANIFEST/MANIFEST.xml` - Package manifest
- `maps/sGoogleMaps.xml` - Google Maps source
- `maps/sBingMaps.xml` - Bing Maps source
- `plugins/DataSync-1.1.0.0-4.7.0.163` - Data Sync plugin
- `plugins/TAKChat-1.0.0.0-4.7.0.163` - TAK Chat plugin

### Enterprise Package

**File: `enterprise-locked.zip`**
- `certs/config.pref` - Locked-down configuration
- `certs/caCert.p12` - CA certificate
- `certs/clientCert.p12` - Client certificate
- `MANIFEST/MANIFEST.xml` - Package manifest

## Deployment Checklist

### Pre-Deployment

- [ ] Generate unique UID for package
- [ ] Verify server hostname/IP address
- [ ] Confirm certificate passwords
- [ ] Test certificates in development environment
- [ ] Validate preference settings
- [ ] Check file paths in MANIFEST.xml

### Package Creation

- [ ] Create directory structure
- [ ] Place certificates in `certs/` directory
- [ ] Create `config.pref` with correct settings
- [ ] Create `MANIFEST.xml` with unique UID
- [ ] Add optional resources (maps, plugins)
- [ ] Compress all files to ZIP archive
- [ ] Verify ZIP file integrity

### Deployment

- [ ] Transfer package to target device
- [ ] Import package using ATAK Import function
- [ ] Verify connection to TAK Server
- [ ] Confirm preference settings applied
- [ ] Test functionality
- [ ] Document deployment

### Post-Deployment

- [ ] Monitor connection status
- [ ] Verify user can access required features
- [ ] Check for any configuration issues
- [ ] Update documentation if needed
- [ ] Archive package for future reference

## Common Issues and Solutions

### Certificate Issues

**Problem**: Certificate import fails
**Solution**: Verify certificate passwords and file paths

**Problem**: Connection refused
**Solution**: Check server hostname/IP and port settings

### Configuration Issues

**Problem**: Preferences not applied
**Solution**: Verify XML syntax and preference key names

**Problem**: Package import fails
**Solution**: Check MANIFEST.xml structure and UID

### Network Issues

**Problem**: Cannot connect to server
**Solution**: Verify network connectivity and firewall settings

**Problem**: SSL/TLS errors
**Solution**: Check certificate validity and server configuration

## Security Best Practices

1. **Unique UIDs**: Always generate unique identifiers for each package
2. **Secure Passwords**: Use strong passwords for certificates
3. **Limited Access**: Restrict access to package creation tools
4. **Audit Trail**: Maintain logs of package deployments
5. **Certificate Management**: Secure storage and distribution of certificates
6. **Package Integrity**: Verify package contents before deployment

## Resources

- [UUID Generator](https://www.uuidgenerator.net/)
- [ATAK-Maps Repository](https://github.com/joshuafuller/ATAK-Maps)

---

**Document Information**
- **Last Updated**: July 10, 2025
- **ATAK Version**: 5.1+
- **Status**: Draft
- **Classification**: Unclassified 