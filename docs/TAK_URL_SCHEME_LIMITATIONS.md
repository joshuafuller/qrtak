# TAK URL Scheme Limitations Documentation

## Overview
This document captures the technical limitations of the TAK:// URL scheme for enrollment, discovered through analysis of ATAK source code and TAK Server implementations.

## Key Findings

### TAK:// Enrollment URL Scheme
The TAK enrollment URL format is:
```
tak://com.atakmap.app/enroll?host=<host>&username=<username>&token=<token>
```

**Supported Parameters:**
- `host` - Server hostname/IP, **or a full connect string** in `host:port:protocol` format
- `username` - Username for authentication
- `token` - Password/token for authentication

### How the `host` Parameter Works
The `host` parameter is passed directly to `CertificateEnrollmentClient.onEnrollmentOk()`, which parses it as a connect string:

```
host=server.com              → connects to server.com:8089:ssl
host=server.com:8090         → connects to server.com:8090:ssl
host=server.com:8090:quic    → connects to server.com:8090:quic
```

Only `quic` is explicitly accepted as a protocol value; all other values fall back to `ssl`.

### Default Connection Behavior
When ATAK processes enrollment URLs (from `CertificateEnrollmentClient.java:771-787`):
- **Default Port**: 8089 (used if not specified in host)
- **Default Protocol**: "ssl" (used unless "quic" explicitly specified)
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

### What Enrollment QR Codes Support
Port and protocol CAN be specified via the `host` parameter as a connect string:

```
tak://com.atakmap.app/enroll?host=server.com:8090:quic&username=user&token=pass
```

This is parsed by `CertificateEnrollmentClient.java:771-787`:
- Port is extracted from the second `:` segment (defaults to 8089)
- Protocol is extracted from the third `:` segment (only `quic` accepted; all else → `ssl`)

### When to Use Data Packages Instead
Data packages remain the better option when you need:
- Pre-provisioned client certificates (soft-cert mode)
- User profile settings (callsign, team, role)
- Multiple server connections in one package
- Non-QUIC alternative protocols (tcp)

#### Data Package config.pref Format
```xml
<entry key="connectString0" class="class java.lang.String">10.10.10.218:8090:quic</entry>
```

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