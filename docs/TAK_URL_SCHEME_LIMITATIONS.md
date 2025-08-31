# TAK URL Scheme Limitations Documentation

## Overview
This document captures the technical limitations of the TAK:// URL scheme for enrollment, discovered through analysis of ATAK source code and TAK Server implementations.

## Key Findings

### TAK:// Enrollment URL Scheme
The TAK enrollment URL format is:
```
tak://com.atakmap.app/enroll?host=<host>&username=<username>&token=<token>
```

**Supported Parameters (ONLY):**
- `host` - Server hostname or IP address
- `username` - Username for authentication
- `token` - Password/token for authentication

**NOT Supported:**
- `port` - Cannot specify custom port
- `protocol` - Cannot specify protocol (SSL, TLS, QUIC)
- Any other connection parameters

### Default Connection Behavior
When ATAK processes enrollment URLs (from `CertificateEnrollmentClient.java`):
- **Default Port**: 8089
- **Default Protocol**: "ssl"
- **Connection String Format**: `host:port:protocol`

### Source Code Evidence

#### From ATAK 5.5.0.0 (CotMapComponent.java)
```java
if ("com.atakmap.app/enroll".equals(u.getHost() + u.getPath())) {
    final String host = u.getQueryParameter("host");
    final String username = u.getQueryParameter("username");
    final String token = u.getQueryParameter("token");
    // Note: No port or protocol parameters extracted!
    
    CertificateEnrollmentClient.getInstance().onEnrollmentOk(
        context, host, "", host, username, token, -1L);
}
```

#### From ATAK 5.5.0.0 (CertificateEnrollmentClient.java)
```java
public void onEnrollmentOk(Context context, String address, ...) {
    // Parse connection string if provided in format host:port:protocol
    String[] split = address.split(":");
    String host = split[0];
    
    // Defaults to port 8089 if not specified
    int port = split.length > 1 ? Parsers.parseInt(split[1], 8089) : 8089;
    
    // Defaults to SSL protocol
    String protocol = "ssl";
    
    // QUIC support exists if specified in connection string
    if (split.length > 2 && "quic".equalsIgnoreCase(split[2])) {
        protocol = split[2];
    }
    
    String connectString = host + ":" + port + ":" + protocol;
}
```

## QUIC Protocol Support

### QUIC is Supported in ATAK
1. **OkHttp3 Protocol Enum** (`okhttp3/Protocol.java`):
   ```java
   public enum Protocol {
       HTTP_1_0("http/1.0"),
       HTTP_1_1("http/1.1"),
       SPDY_3("spdy/3.1"),
       HTTP_2("h2"),
       H2_PRIOR_KNOWLEDGE("h2_prior_knowledge"),
       QUIC("quic");
   }
   ```

2. **CommonCommo Transport** (`com/atakmap/commoncommo/StreamingTransport.java`):
   ```java
   public enum StreamingTransport {
       TCP(0),
       SSL(1),
       QUIC(2);
   }
   ```

### TAK Server QUIC Support
From TAK Server source code:
- **Default QUIC Port**: 8090
- **Implementation**: Netty-based QUIC server (`QuicStreamingServer.java`)
- **Connection Test Enum**: `BaseConnections.java` defines standard ports:
  - 8089: SSL/TLS connections
  - 8090: Authenticated TLS/QUIC connections

## Implications for QR Code Enrollment

### Current Limitations
1. **Cannot use QUIC via QR enrollment** - Always defaults to SSL on port 8089
2. **Cannot specify custom ports** - Always uses 8089
3. **Cannot use alternative protocols** - Always uses SSL

### Workaround: Data Packages
For QUIC or custom port connections, users MUST use data packages with proper connection strings:

#### Data Package config.pref Format
```xml
<preference name="connectString0" value="10.10.10.218:8090:quic"/>
```

This allows full specification of:
- Custom host
- Custom port (e.g., 8090 for QUIC)
- Protocol (tcp, ssl, tls, quic)

## Version History
- **ATAK 5.1.0.6**: Added "allow caller to specify protocol in connection string for Quick Connect"
- **ATAK 5.5.0.0**: Current version analyzed, QUIC support confirmed but not accessible via enrollment URLs

## Development Recommendations

### For qrtak
1. **Keep current warning**: Users need to know enrollment QR codes default to port 8089/SSL
2. **Emphasize Package Builder**: For QUIC or custom ports, Package Builder is the only option
3. **Cannot enhance enrollment URLs**: The limitation is in ATAK's URL handler, not our code

### Future Possibilities
If ATAK were to support port/protocol in enrollment URLs, the format might be:
```
tak://com.atakmap.app/enroll?host=<host>&port=<port>&protocol=<protocol>&username=<username>&token=<token>
```

However, this would require changes to ATAK's `CotMapComponent.onStartUriReceiver` implementation.

## Testing Notes
- Enrollment URLs were tested with ATAK 5.5.0.0
- QUIC connections confirmed working via data packages
- Standard ports tested: 8089 (SSL), 8090 (QUIC)

## References
- ATAK CIV SDK 5.5.0.0 (commit: cdae3a1)
- TAK Server source code (examined 2024)
- TAK documentation: https://mytecknet.com/tak-qr-codes/