# TAK Data Package Technical Specification

This document defines the technical specifications for creating TAK data packages used for client configuration and enrollment. Data packages provide a turnkey solution for deploying TAK clients with pre-configured settings, certificates, and optional components like plugins and map sources.

---

## 1. Overview

TAK data packages are compressed files containing configuration files, certificates, and optional components that enable rapid deployment of TAK clients. They support two main deployment methods:

- **Soft-Certificate Deployment**: Manual certificate issuance with signed certificates bundled with trusted certificates
- **Certificate Auto-Enrollment Deployment**: Automated enrollment using trusted certificates and TAK credentials

---

## 2. Basic Requirements

### 2.1 File Structure

At minimum, a data package requires:
- `config.pref` - Configuration preferences file
- `MANIFEST.xml` - Package manifest defining contents and metadata
- Certificate files (`.p12` format)

### 2.2 Directory Organization

```
dataPackage/
├── certs/
│   ├── config.pref
│   ├── caCert.p12
│   └── clientCert.p12 (soft-cert only)
└── MANIFEST/
    └── MANIFEST.xml
```

---

## 3. Configuration File (config.pref)

### 3.1 Soft-Certificate Deployment

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

**Required Files:** `caCert.p12`, `clientCert.p12`

### 3.2 Certificate Auto-Enrollment Deployment

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

**Required Files:** `caCert.p12` only

### 3.3 Configuration Parameters

| Parameter | Description | Required | Example |
|-----------|-------------|----------|---------|
| `connectString0` | TAK server connection string | Yes | `TAKSERVER:8089:ssl` |
| `caPassword` | CA certificate password | Yes | `PASSWORD` |
| `clientPassword` | Client certificate password | Soft-cert only | `PASSWORD` |
| `locationCallsign` | User callsign | No | `CALLSIGN` |
| `locationTeam` | Team color/affiliation | No | `Green`, `Blue`, `Red` |
| `atakRoleType` | User role | No | `Team Lead`, `Team Member` |

---

## 4. Manifest File (MANIFEST.xml)

### 4.1 Soft-Certificate MANIFEST.xml

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

### 4.2 Certificate Auto-Enrollment MANIFEST.xml

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

### 4.3 Manifest Parameters

| Parameter | Description | Required | Example |
|-----------|-------------|----------|---------|
| `uid` | Unique identifier for the package | Yes | UUID format |
| `name` | Name of the compressed file | Yes | `TAK_Server.zip` |
| `onReceiveDelete` | Delete package after import | No | `true`/`false` |

**⚠️ Important:** Replace the example UID with a unique UUID generated at [uuidgenerator.net](https://www.uuidgenerator.net/)

---

## 5. Optional Configurations

### 5.1 Plugins and Maps

Extended directory structure with plugins and maps:

```
dataPackage/
├── certs/
│   ├── config.pref
│   ├── caCert.p12
│   └── clientCert.p12
├── maps/
│   ├── sGoogleMaps.xml
│   └── sBingMaps.xml
├── plugins/
│   ├── DataSync-1.1.0.0-4.7.0.163
│   └── TAKChat-1.0.0.0-4.7.0.163
└── MANIFEST/
    └── MANIFEST.xml
```

Updated MANIFEST.xml with additional content:

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

### 5.2 Preference Locking

To disable or hide preferences in enterprise environments:

```xml
<entry key="hidePreferenceItem_locationCallsign" class="class java.lang.Boolean">true</entry>
<entry key="hidePreferenceItem_networkGpsCategory" class="class java.lang.Boolean">true</entry>
```

---

## 6. iTAK Deployment Packages

### 6.1 iTAK File Structure

iTAK requires a different file structure with files at the root level:

```
iTAK_Package.zip
├── config.pref
├── caCert.p12
└── clientCert.p12 (soft-cert only)
```

### 6.2 iTAK Soft-Certificate config.pref

**⚠️ Important**: iTAK uses a different path handling mechanism. Even though certificate files are placed at the root level of the package, the config.pref must still reference them using `cert/` paths. ATAK automatically handles the path mapping for iTAK packages.

**Protocol tokens in connectString**: iTAK packages use the same `connectString` convention as ATAK:

```
HOST:PORT:PROTOCOL
```

where `PROTOCOL` is `ssl` (HTTPS) or `tcp` (HTTP). QUIC is not supported in iTAK package `connectString`.

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

---

## 7. Package Creation and Deployment

### 7.1 Creating the Package

1. **Organize Files**: Create the directory structure with all required files
2. **Generate UUID**: Create a unique UID for the MANIFEST.xml
3. **Compress**: Select all folders/files and create a ZIP archive
4. **Rename**: Name the compressed file to match the `name` parameter in MANIFEST.xml

### 7.2 Deployment Methods

#### ATAK/WinTAK
- **Import File**: Use "Import File" from the TAK client menu
- **Drag-and-Drop**: WinTAK supports drag-and-drop import

#### iTAK
- **Settings → Network → Server → Add Server (+) → Upload Server Package**

---

## 8. Security Considerations

### 8.1 Certificate Management
- **Soft-Certificate**: Requires both CA and client certificates
- **Auto-Enrollment**: Requires only CA certificate
- **Password Protection**: All certificates should be password-protected

### 8.2 Credential Security
- **Plaintext Passwords**: Passwords are stored in plaintext in config.pref
- **Controlled Distribution**: Limit access to data packages containing credentials
- **Audit Trail**: Maintain records of distributed packages

### 8.3 Best Practices
- Use unique UIDs for each package
- Test packages in controlled environments before deployment
- Regularly rotate certificates and passwords
- Implement proper access controls for package distribution

---

## 9. Troubleshooting

### 9.1 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Import fails | Incorrect file paths in MANIFEST.xml | Verify zipEntry paths match actual file structure |
| Certificate errors | Wrong certificate format or password | Ensure .p12 format and correct passwords |
| Connection failures | Incorrect connectString format | Verify `HOST:PORT:PROTOCOL` format |

### 9.2 Validation Checklist

- [ ] Unique UID generated and used
- [ ] All required files included in package
- [ ] File paths in MANIFEST.xml match actual structure
- [ ] Certificate passwords correctly specified
- [ ] Package name matches MANIFEST.xml name parameter
- [ ] Package tested with target TAK client version

---

## 10. References

- [myTeckNet: Creating TAK Data Packages for Enrollment](https://mytecknet.com/creating-tak-data-packages-for-enrollment/)
- [ATAK Community Wiki](https://github.com/deptofdefense/AndroidTacticalAssaultKit-CIV/wiki)
- [UUID Generator](https://www.uuidgenerator.net/)

---

## 11. Version History

- **v0.1** (2025-07-10): Initial specification based on myTeckNet documentation
- Incorporates ATAK 4.10.0.x UID requirements
- Includes both soft-certificate and auto-enrollment methods
- Covers ATAK, WinTAK, and iTAK deployment options 
