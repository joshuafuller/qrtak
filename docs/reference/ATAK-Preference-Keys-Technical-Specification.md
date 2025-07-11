# ATAK Preference Keys Technical Specification

## Overview

This document provides a comprehensive technical specification for ATAK (Android Team Awareness Kit) preference keys that can be configured programmatically through QR codes, data packages, or direct configuration files. These preferences control various aspects of ATAK functionality including user identity, network settings, display options, and operational parameters.

## Document Version
- **Version**: 0.2
- **Date**: July 2025
- **Based on**: ATAK 5.2 Official Change Log (July 2024)
- **Compatibility**: ATAK 5.2+, iTAK iOS, WinTAK

## Table of Contents

1. [Introduction](#introduction)
2. [Preference Key Structure](#preference-key-structure)
3. [Data Types](#data-types)
4. [QR Code Integration](#qr-code-integration)
5. [Data Package Deployment](#data-package-deployment)
6. [Preference Categories](#preference-categories)
7. [Detailed Preference Reference](#detailed-preference-reference)
8. [Implementation Guidelines](#implementation-guidelines)
9. [Security Considerations](#security-considerations)
10. [Examples](#examples)

## Introduction

ATAK preference keys provide a standardized way to configure application settings programmatically. These keys can be set through multiple methods:

- **QR Code URLs**: Using the `tak://com.atakmap.app/preference` protocol
- **Data Packages**: Embedded in enrollment or configuration packages
- **Direct Configuration**: Manual editing of preference files
- **Server Profiles**: Pushed from TAK Server during enrollment

### Key Benefits

- **Standardization**: Consistent configuration across devices and teams
- **Automation**: Reduce manual configuration errors
- **Scalability**: Deploy configurations to multiple devices simultaneously
- **Flexibility**: Support for both simple and complex configuration scenarios

## Preference Key Structure

### Basic Format

Each preference key follows this structure:

```
key[n] = preference_key_name
type[n] = data_type
value[n] = preference_value
```

Where:
- `n` is a sequential number (1, 2, 3, etc.)
- `preference_key_name` is the internal ATAK preference identifier
- `data_type` is one of: `string`, `boolean`, `long`, `int`
- `preference_value` is the actual value to be set

### URL Format for QR Codes

```
tak://com.atakmap.app/preference?key1={key}&type1={type}&value1={value}&key2={key}&type2={type}&value2={value}...
```

## Data Types

### String
- **Description**: Text-based values
- **Examples**: Callsigns, team names, coordinate formats
- **Validation**: Varies by preference (alphanumeric, enumerated values, etc.)

### Boolean
- **Description**: True/false values
- **Values**: `true`, `false`
- **Examples**: Enable/disable features, show/hide elements

### Integer/Long
- **Description**: Numeric values
- **Range**: Varies by preference (typically 0-65535 for ports, 0-16777215 for colors)
- **Examples**: Port numbers, timeouts, color values

## QR Code Integration

### Protocol Support

ATAK 5.1+ supports three main QR code protocols:

1. **Enrollment**: `tak://com.atakmap.app/enroll`
2. **Import**: `tak://com.atakmap.app/import`
3. **Preference**: `tak://com.atakmap.app/preference`

### Preference QR Code Example

```
tak://com.atakmap.app/preference?key1=locationTeam&type1=string&value1=Dark Blue&key2=atakRoleType&type2=string&value2=Team Member&key3=coord_display_pref&type3=string&value3=UTM&key4=alt_display_agl&type4=boolean&value4=true
```

### URL Encoding Requirements

- All special characters must be URL-encoded
- Spaces become `%20`
- Colons become `%3A`
- Forward slashes become `%2F`

## Data Package Deployment

### Overview

Data packages provide the most comprehensive method for deploying ATAK configurations. They support both soft-certificate and certificate auto-enrollment deployment methods, and can include additional resources like plugins and map sources.

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

### Deployment Methods

#### 1. Soft-Certificate Deployment

**Description**: Manual certificate issuance with signed certificate bundled with trusted certificate.

**Required Files**:
- `certs/config.pref`
- `certs/caCert.p12`
- `certs/clientCert.p12`
- `MANIFEST/MANIFEST.xml`

**config.pref Example**:
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
  </preference>
</preferences>
```

#### 2. Certificate Auto-Enrollment Deployment

**Description**: Automatic certificate enrollment using trusted certificate and TAK credentials.

**Required Files**:
- `certs/config.pref`
- `certs/caCert.p12`
- `MANIFEST/MANIFEST.xml`

**config.pref Example**:
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
  </preference>
</preferences>
```

### MANIFEST.xml

The MANIFEST.xml file defines the data package structure and metadata.

**Key Parameters**:
- `uid`: Unique identifier (generate at https://www.uuidgenerator.net/)
- `name`: Package name (matches ZIP filename)
- `onReceiveDelete`: Whether to delete package after import

**Soft-Certificate MANIFEST.xml**:
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

**Certificate Auto-Enrollment MANIFEST.xml**:
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

### Advanced Configurations

#### Including Plugins and Maps

Data packages can include additional resources:

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
    <Content ignore="false" zipEntry="maps/sGoogleMaps.xml"/>
    <Content ignore="false" zipEntry="maps/sBingMaps.xml"/>
    <Content ignore="false" zipEntry="plugins/DataSync-1.1.0.0-4.7.0.163"/>
    <Content ignore="false" zipEntry="plugins/TAKChat-1.0.0.0-4.7.0.163"/>
  </Contents>
</MissionPackageManifest>
```

#### Disabling and Hiding Preferences

Enterprise environments can lock down preferences:

```xml
<preference version="1" name="com.atakmap.app_preferences">
  <entry key="locationCallsign" class="class java.lang.String">CALLSIGN</entry>
  <entry key="locationTeam" class="class java.lang.String">Green</entry>
  <entry key="atakRoleType" class="class java.lang.String">Team Lead</entry>
  <entry key="hidePreferenceItem_locationCallsign" class="class java.lang.Boolean">true</entry>
  <entry key="hidePreferenceItem_networkGpsCategory" class="class java.lang.Boolean">true</entry>
</preference>
```

### iTAK Deployment

iTAK uses a simplified structure with files in the root directory:

```
iTAK_Package.zip
├── config.pref
├── caCert.p12
└── clientCert.p12 (soft-cert only)
```

**iTAK config.pref Example**:
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

### Creating and Importing Data Packages

1. **Create File Structure**: Organize files in appropriate directories
2. **Generate UID**: Create unique identifier using UUID generator
3. **Update MANIFEST.xml**: Configure package metadata and contents
4. **Compress**: Create ZIP archive with all required files
5. **Import**: Use ATAK's Import File function or drag-and-drop (WinTAK)

## Preference Categories

### 1. Identity and Team Settings
- **Purpose**: Configure user identity and team affiliation
- **Key Preferences**: `locationCallsign`, `locationTeam`, `atakRoleType`, `locationUnitType`

### 2. Network and Connectivity
- **Purpose**: Control network behavior and server connections
- **Key Preferences**: `dispatchLocationCotExternal`, `displayServerConnectionWidget`, `enableNonStreamingConnections`

### 3. Display and UI
- **Purpose**: Customize visual appearance and user interface
- **Key Preferences**: `coord_display_pref`, `alt_display_pref`, `map_zoom_visible`, `largeTextMode`

### 4. GPS and Location
- **Purpose**: Configure GPS behavior and location reporting
- **Key Preferences**: `mockingOption`, `useGPSTime`, `locationReportingStrategy`

### 5. Communication
- **Purpose**: Set up contact information and communication preferences
- **Key Preferences**: `saHasPhoneNumber`, `saSipAddress`, `saXmppUsername`

### 6. Tools and Features
- **Purpose**: Enable/disable specific ATAK tools and features
- **Key Preferences**: `atakControlBluetooth`, `nonBluetoothLaserRangeFinder`, `autostart_nineline`

## Detailed Preference Reference

### Identity and Team Settings

#### locationCallsign
- **Type**: String
- **Description**: User's callsign identifier
- **Values**: Alphanumeric text
- **Example**: `"ALPHA-01"`
- **Default**: Empty

#### locationTeam
- **Type**: String
- **Description**: Team color affiliation
- **Values**: 
  - White, Yellow, Orange, Magenta
  - Red, Maroon, Purple, Dark Blue
  - Blue, Cyan, Teal, Green, Dark Green, Brown
- **Example**: `"Dark Blue"`
- **Default**: White

#### atakRoleType
- **Type**: String
- **Description**: User's operational role
- **Values**:
  - Team Member, Team Lead, HQ
  - Sniper, Medic, Forward Observer
  - RTO, K9
- **Example**: `"Team Member"`
- **Default**: Team Member

#### locationUnitType
- **Type**: String
- **Description**: Unit display type on map
- **Values**:
  - Ground Troop, Armored Vehicle, Civilian Vehicle
  - Generic Air Unit, Generic Ground Unit, Generic Sea Surface Unit
- **Example**: `"Ground Troop"`
- **Default**: Ground Troop

### Network and Connectivity

#### dispatchLocationCotExternal
- **Type**: Boolean
- **Description**: Enable location broadcasting over network
- **Values**: `true`, `false`
- **Default**: `true`

#### displayServerConnectionWidget
- **Type**: Boolean
- **Description**: Show server connection status widget
- **Values**: `true`, `false`
- **Default**: `true`

#### enableNonStreamingConnections
- **Type**: Boolean
- **Description**: Enable mesh network mode
- **Values**: `true`, `false`
- **Default**: `false`

### Display and UI

#### coord_display_pref
- **Type**: String
- **Description**: Coordinate display format
- **Values**: MGRS, DD, DM, DMS, UTM
- **Example**: `"UTM"`
- **Default**: MGRS

#### alt_display_pref
- **Type**: String
- **Description**: Altitude reference system
- **Values**: HAE, MSL
- **Example**: `"HAE"`
- **Default**: HAE

#### alt_unit_pref
- **Type**: String
- **Description**: Altitude units
- **Values**: 
  - `"0"` = Feet (ft)
  - `"1"` = Meters (m)
- **Example**: `"1"`
- **Default**: `"0"`

#### map_zoom_visible
- **Type**: Boolean
- **Description**: Show zoom controls on map
- **Values**: `true`, `false`
- **Default**: `true`

#### largeTextMode
- **Type**: Boolean
- **Description**: Enable large text mode for accessibility
- **Values**: `true`, `false`
- **Default**: `false`

### GPS and Location

#### mockingOption
- **Type**: String
- **Description**: GPS source configuration
- **Values**:
  - `"IgnoreInternalGPS"` = Ignore Internal GPS / Use External or Network GPS Only
  - `"LocalGPS"` = Internal GPS Only
  - `"WRGPS"` = External or Network GPS / Fallback Internal GPS
- **Example**: `"WRGPS"`
- **Default**: `"LocalGPS"`

#### useGPSTime
- **Type**: Boolean
- **Description**: Use GPS time instead of device time
- **Values**: `true`, `false`
- **Default**: `false`

#### locationReportingStrategy
- **Type**: String
- **Description**: Location update frequency strategy
- **Values**: Dynamic, Constant
- **Example**: `"Dynamic"`
- **Default**: Dynamic

### Communication

#### saHasPhoneNumber
- **Type**: Boolean
- **Description**: Publish phone number to other users
- **Values**: `true`, `false`
- **Default**: `false`

#### saSipAddress
- **Type**: String
- **Description**: VoIP number configuration
- **Values**:
  - No VOIP, Manual Entry
  - Use IP Address, Use Callsign and IP Address
- **Example**: `"Manual Entry"`
- **Default**: No VOIP

#### saXmppUsername
- **Type**: String
- **Description**: XMPP username for chat
- **Values**: Alphanumeric text
- **Example**: `"user123"`
- **Default**: Empty

### Tools and Features

#### atakControlBluetooth
- **Type**: Boolean
- **Description**: Enable Bluetooth support
- **Values**: `true`, `false`
- **Default**: `true`

#### nonBluetoothLaserRangeFinder
- **Type**: Boolean
- **Description**: Enable non-Bluetooth LRF support
- **Values**: `true`, `false`
- **Default**: `false`

#### autostart_nineline
- **Type**: Boolean
- **Description**: Auto-start 9-line tool on placement
- **Values**: `true`, `false`
- **Default**: `false`

## Implementation Guidelines

### Best Practices

1. **Validation**: Always validate preference values before setting
2. **Defaults**: Provide sensible defaults for all preferences
3. **Documentation**: Document any custom preference usage
4. **Testing**: Test configurations across different ATAK versions
5. **Security**: Avoid sensitive data in QR codes

### Error Handling

- Invalid preference keys are ignored
- Invalid values may cause unexpected behavior
- Type mismatches can cause application errors
- Always test configurations in a safe environment

### Performance Considerations

- Limit QR code size (recommended < 2KB)
- Batch related preferences together
- Use appropriate data types for values
- Consider network impact of location reporting settings

## Security Considerations

### QR Code Security

- **Credential Exposure**: Avoid embedding credentials in QR codes
- **Public Access**: QR codes can be scanned by anyone with access
- **Tampering**: QR codes can be modified or replaced
- **Audit Trail**: Maintain logs of configuration changes

### Network Security

- **Encryption**: Use SSL/TLS for all network communications
- **Authentication**: Verify server certificates
- **Authorization**: Implement proper access controls
- **Monitoring**: Monitor for unauthorized configuration changes

### Data Protection

- **PII**: Avoid personal information in preferences
- **Sensitive Data**: Encrypt sensitive configuration data
- **Access Control**: Limit access to configuration tools
- **Compliance**: Follow relevant security standards

### Data Package Security

- **Unique UIDs**: Always generate unique identifiers for each package
- **Certificate Management**: Secure storage and distribution of certificates
- **Package Integrity**: Verify package contents before deployment
- **Access Control**: Limit access to data package creation tools

## Examples

### Basic Team Configuration (QR Code)

```
tak://com.atakmap.app/preference?key1=locationCallsign&type1=string&value1=ALPHA-01&key2=locationTeam&type2=string&value2=Dark Blue&key3=atakRoleType&type3=string&value3=Team Member
```

### Display Configuration (QR Code)

```
tak://com.atakmap.app/preference?key1=coord_display_pref&type1=string&value1=UTM&key2=alt_display_pref&type2=string&value2=HAE&key3=alt_unit_pref&type3=string&value3=1&key4=largeTextMode&type4=boolean&value4=true
```

### Complete Data Package Configuration

**config.pref**:
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
    <entry key="locationCallsign" class="class java.lang.String">ALPHA-01</entry>
    <entry key="locationTeam" class="class java.lang.String">Dark Blue</entry>
    <entry key="atakRoleType" class="class java.lang.String">Team Member</entry>
    <entry key="coord_display_pref" class="class java.lang.String">UTM</entry>
    <entry key="alt_display_pref" class="class java.lang.String">HAE</entry>
    <entry key="alt_unit_pref" class="class java.lang.String">1</entry>
    <entry key="largeTextMode" class="class java.lang.Boolean">false</entry>
    <entry key="dispatchLocationCotExternal" class="class java.lang.Boolean">true</entry>
    <entry key="enableNonStreamingConnections" class="class java.lang.Boolean">false</entry>
  </preference>
</preferences>
```

**MANIFEST.xml**:
```xml
<MissionPackageManifest version="2">
  <Configuration>
    <Parameter name="uid" value="a647112f-ce05-4312-a2b4-208d8d8a5fa8"/>
    <Parameter name="name" value="ALPHA-01_Config.zip"/>
    <Parameter name="onReceiveDelete" value="true"/>
  </Configuration>
  <Contents>
    <Content ignore="false" zipEntry="certs/config.pref"/>
    <Content ignore="false" zipEntry="certs/caCert.p12"/>
    <Content ignore="false" zipEntry="certs/clientCert.p12"/>
  </Contents>
</MissionPackageManifest>
```

## Conclusion

This technical specification provides a comprehensive reference for ATAK preference keys and deployment methods. When implementing preference-based configurations:

1. **Start Simple**: Begin with basic identity and display preferences
2. **Test Thoroughly**: Validate all configurations before deployment
3. **Document Changes**: Maintain records of configuration modifications
4. **Monitor Results**: Track the impact of configuration changes
5. **Iterate**: Refine configurations based on user feedback and operational needs

For additional information, refer to the ATAK User Manual and official documentation available through the TAK Product Center.

---

**Document Information**
- **Last Updated**: July 10, 2025
- **ATAK Version**: 5.1+
- **Status**: Draft
- **Classification**: Unclassified 