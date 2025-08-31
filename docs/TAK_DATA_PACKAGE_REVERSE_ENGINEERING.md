# TAK Data Package Complete Reverse Engineering Documentation

## Overview
TAK Data Packages (Mission Packages) are ZIP files containing configuration, certificates, and content that can be imported into ATAK. They enable full connection configuration including QUIC protocol support.

## Data Package Structure

### Standard ZIP Layout
```
datapackage.zip/
├── MANIFEST/
│   └── manifest.xml           # Package metadata and contents listing
├── certs/                     # Certificate files
│   ├── clientcert.p12        # Client certificate
│   └── truststore.p12        # CA certificate
├── prefs/                     # Preference files
│   └── config.pref           # Connection configuration
└── files/                     # Additional content
    └── ...                   # Maps, imagery, documents, etc.
```

## Connection Configuration Processing

### 1. Connection String Format
From `NetConnectString.java`:

```java
public class NetConnectString {
    private final String _host;
    private final int _port;
    private final String _proto;
    
    // Standard format: host:port:protocol
    // Example: "server.example.com:8090:quic"
    
    public String toString() {
        return this._host + ":" + this._port + ":" + this._proto;
    }
    
    private static NetConnectString parseConnectString(String connectString) {
        String[] parts = connectString.split(":");
        
        // Handle various formats:
        // "host:port:protocol" - standard format
        // "host:port" - protocol defaults to null
        // "protocol://host:port" - URL-style format
        
        if (parts[0] == null || parts[0].equals("")) {
            // ":port" format - binds to all interfaces
            host = "0.0.0.0";
            port = Integer.parseInt(parts[1]);
        } else if (parts[1].contains("//")) {
            // "protocol://host:port" format
            proto = parts[0];
            host = parts[1].replace("/", "");
            port = Integer.parseInt(parts[2]);
        } else {
            // "host:port:protocol" standard format
            host = parts[0];
            port = Integer.parseInt(parts[1]);
            proto = parts[2].toLowerCase();
        }
        
        // Optional 4th part for callsign
        if (parts.length > 3) {
            result.setCallsign(parts[3]);
        }
    }
}
```

### 2. Protocol Support
From `CotServiceRemote.Proto` and `StreamingTransport`:

```java
// CommonCommo StreamingTransport enum
public enum StreamingTransport {
    TCP(0),    // Plain TCP
    SSL(1),    // SSL/TLS (default)
    QUIC(2);   // QUIC protocol
}

// Protocol values in connection strings:
// "tcp" - Plain TCP
// "ssl" - SSL/TLS (default for enrollment)
// "tls" - TLS (treated same as SSL)
// "quic" - QUIC protocol
```

### 3. TAKServer Properties
From `TAKServer.java`:

```java
public class TAKServer {
    // Connection properties keys
    public static final String CONNECT_STRING_KEY = "connectString";
    public static final String DESCRIPTION_KEY = "description";
    public static final String ENABLED_KEY = "enabled";
    public static final String USERNAME_KEY = "username";
    public static final String PASSWORD_KEY = "password";
    public static final String CACHECREDS_KEY = "cacheCreds";
    public static final String COMPRESSION_KEY = "compress";
    public static final String ENROLL_FOR_CERT_KEY = "enrollForCertificateWithTrust";
    public static final String ENROLL_USE_TRUST_KEY = "enrollUseTrust";
    public static final String EXPIRATION_KEY = "expiration";
    public static final String USEAUTH_KEY = "useAuth";
    public static final String SERVER_VERSION_KEY = "serverVersion";
    public static final String SERVER_API_KEY = "serverAPI";
    
    public String getURL(boolean includePort) {
        NetConnectString ncs = NetConnectString.fromString(getConnectString());
        String proto = ncs.getProto();
        
        // Map connection protocol to HTTP(S)
        if (proto.equalsIgnoreCase("ssl") || proto.equalsIgnoreCase("quic")) {
            proto = "https";
        } else {
            proto = "http";
        }
        
        String url = proto + "://" + ncs.getHost();
        if (includePort) {
            url += ":" + ncs.getPort();
        }
        return url;
    }
}
```

## Preference File Format

### config.pref Structure
TAK uses Java Properties format for preference files:

```properties
# Connection configuration
connectString0=server.example.com:8090:quic
description0=QUIC Server Connection
enabled0=true
useAuth0=true
username0=myusername
cacheCreds0=true
compress0=false

# Certificate configuration
caLocation=/storage/certs/truststore.p12
caPassword=password123
certificateLocation=/storage/certs/clientcert.p12
clientPassword=clientpass456

# Enrollment settings
enrollForCertificateWithTrust=false
enrollUseTrust=true
expiration=-1
```

### Multiple Connections
Data packages can configure multiple connections:
```properties
# First connection (QUIC)
connectString0=server1.com:8090:quic
description0=Primary QUIC Server
enabled0=true

# Second connection (SSL)
connectString1=server2.com:8089:ssl
description1=Backup SSL Server
enabled1=true

# Third connection (TCP)
connectString2=192.168.1.100:8087:tcp
description2=Local TCP Server
enabled2=false
```

## Certificate Import Process

### From ImportCertSort.java:

```java
public class ImportCertSort extends ImportResolver {
    
    // Certificate import from properties
    private boolean importCertificatesFromProperties(Properties properties, ...) {
        // Import CA certificate
        String caLocation = properties.getProperty("caLocation");
        if (AtakCertificateDatabaseBase.importCertificate(
                caLocation, connectString, "TRUST_STORE_CA", true) != null) {
            String caPassword = properties.getProperty("caPassword");
            if (caPassword != null) {
                AtakCertificateDatabaseBase.saveCertificatePassword(
                    caPassword, TYPE_caPassword, connectString);
            }
        }
        
        // Import client certificate
        String clientLocation = properties.getProperty("certificateLocation");
        if (AtakCertificateDatabaseBase.importCertificate(
                clientLocation, connectString, "CLIENT_CERTIFICATE", true) != null) {
            String clientPassword = properties.getProperty("clientPassword");
            if (clientPassword != null) {
                AtakCertificateDatabaseBase.saveCertificatePassword(
                    clientPassword, TYPE_clientPassword, connectString);
            }
        }
    }
}
```

## COT Stream Loading Process

### From CotService.java:

```java
public static List<Properties> loadCotStreamProperties(Context context) {
    List<Properties> results = new ArrayList<>();
    
    // Load from cot_streams directory
    File[] streams = IOProviderFactory.listFiles(
        getConnectionsDir(context, "cot_streams"));
    
    for (File config : streams) {
        Properties props = new Properties();
        FileInputStream fis = IOProviderFactory.getInputStream(config);
        props.load(fis);
        
        // Each file contains connection properties
        String connectString = props.getProperty(TAKServer.CONNECT_STRING_KEY);
        String description = props.getProperty(TAKServer.DESCRIPTION_KEY);
        boolean isEnabled = !props.getProperty(TAKServer.ENABLED_KEY, "1").equals("0");
        
        results.add(props);
    }
    return results;
}
```

## Mission Package Manifest

### From MissionPackageManifest.java:

```java
@Root(name = "MissionPackageManifest")
public class MissionPackageManifest {
    
    @Attribute(name = "version", required = true)
    private int VERSION = 2;
    
    @Element(name = "Configuration", required = true)
    MissionPackageConfiguration _configuration;
    
    @Element(name = "Contents", required = true)
    MissionPackageContents _contents;
    
    // Configuration contains parameters like:
    // - uid: Unique identifier
    // - name: Package name
    // - onReceiveDelete: Auto-delete after import
    // - onReceiveImport: Auto-import on receive
}
```

### manifest.xml Example:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<MissionPackageManifest version="2">
    <Configuration>
        <Parameter name="uid" value="abc123-def456"/>
        <Parameter name="name" value="TAK Server Configuration"/>
        <Parameter name="onReceiveDelete" value="true"/>
    </Configuration>
    <Contents>
        <Content ignore="false" zipEntry="prefs/config.pref"/>
        <Content ignore="false" zipEntry="certs/truststore.p12"/>
        <Content ignore="false" zipEntry="certs/clientcert.p12"/>
    </Contents>
</MissionPackageManifest>
```

## Key Data Package Features

### 1. Full Connection Specification
Unlike enrollment URLs, data packages support:
- **Custom ports**: Any port number (8087, 8089, 8090, etc.)
- **All protocols**: tcp, udp, ssl, tls, quic
- **Multiple connections**: Configure multiple servers
- **Advanced settings**: Compression, authentication, timeouts

### 2. Certificate Management
- Include P12 certificates directly in package
- Automatic certificate import with passwords
- Support for both CA and client certificates
- Certificate enrollment configuration

### 3. Auto-Configuration
- Auto-import on receive
- Auto-delete after import
- Enable/disable connections
- Set connection priorities

## Standard Port Assignments

From TAK Server BaseConnections.java:
- **8087**: TCP/UDP (plain text)
- **8088**: STCP (Streaming TCP)
- **8089**: SSL/TLS (default for enrollment)
- **8090**: Authenticated TLS/QUIC
- **8443**: HTTPS web interface
- **8446**: Certificate enrollment HTTPS

## QUIC-Specific Configuration

### Example QUIC Data Package Structure:
```
quic-config.zip/
├── MANIFEST/
│   └── manifest.xml
├── prefs/
│   └── config.pref
└── certs/
    ├── truststore-ca.p12
    └── client-cert.p12
```

### config.pref for QUIC:
```properties
# QUIC connection configuration
connectString0=tak-server.example.com:8090:quic
description0=TAK Server QUIC Connection
enabled0=true
useAuth0=true
username0=takuser
cacheCreds0=true

# Certificate paths (relative to package)
caLocation=certs/truststore-ca.p12
caPassword=capass123
certificateLocation=certs/client-cert.p12
clientPassword=clientpass456
```

## Import Processing Flow

1. **Package Extraction**: ZIP file extracted to temporary directory
2. **Manifest Parsing**: Read manifest.xml for contents listing
3. **Certificate Import**: Import certificates from certs/ directory
4. **Preference Loading**: Load connection properties from prefs/
5. **Connection Creation**: Create TAKServer instances with connection strings
6. **Stream Configuration**: Configure COT streams with properties
7. **Reconnection**: Trigger reconnection with new configuration

## Security Considerations

1. **Certificate Passwords**: Stored in Android Keystore after import
2. **Connection Credentials**: Can be cached or prompted each time
3. **Auto-Import**: Can be configured to require user confirmation
4. **Package Validation**: Manifest verification before processing

## Testing Data Packages

### Create Test Package:
```bash
# Create directory structure
mkdir -p test-package/{MANIFEST,prefs,certs}

# Create config.pref
echo "connectString0=server.com:8090:quic" > test-package/prefs/config.pref
echo "description0=Test QUIC Server" >> test-package/prefs/config.pref

# Create manifest.xml
cat > test-package/MANIFEST/manifest.xml << EOF
<?xml version="1.0" encoding="UTF-8"?>
<MissionPackageManifest version="2">
    <Configuration>
        <Parameter name="uid" value="test-123"/>
        <Parameter name="name" value="Test Config"/>
    </Configuration>
    <Contents>
        <Content ignore="false" zipEntry="prefs/config.pref"/>
    </Contents>
</MissionPackageManifest>
EOF

# Create ZIP
cd test-package && zip -r ../test-config.zip *
```

## Summary

Data packages provide complete connection configuration capabilities that enrollment URLs cannot offer. They are the only way to:
1. Configure QUIC connections (port 8090, protocol "quic")
2. Use custom ports beyond the default 8089
3. Configure multiple server connections
4. Include certificates with automatic import
5. Set advanced connection parameters

The connection string format `host:port:protocol` is consistent throughout ATAK, with data packages being the primary mechanism for distributing complete connection configurations including QUIC support.