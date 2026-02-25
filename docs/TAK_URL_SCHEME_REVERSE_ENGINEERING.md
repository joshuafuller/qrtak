# TAK:// URL Scheme Complete Reverse Engineering Documentation

## URL Processing Flow in ATAK

### 1. Entry Point: ATAKActivity
When ATAK receives a URL (from QR code, link, or external app):

```java
// ATAKActivity.java
public void onNewIntent(Intent intent) {
    if (intent != null && intent.getData() != null) {
        Uri uri = intent.getData();
        this.pendingOnStartUri = uri;
        processPendingUri();
    }
}

private synchronized void processPendingUri() {
    if (this.pendingOnStartUri != this.processedOnStartUri) {
        Intent onStartUri = new Intent(ONSTART_URI);
        onStartUri.putExtra(ImportReceiver.EXTRA_URI, this.pendingOnStartUri);
        this.processedOnStartUri = this.pendingOnStartUri;
        AtakBroadcast.getInstance().sendBroadcast(onStartUri);
    }
}
```

### 2. Broadcast Distribution
The `ONSTART_URI` broadcast (`com.atakmap.app.ONSTART_URI`) is sent with the URI as an extra.

## Supported TAK:// URL Schemes

### 1. Enrollment URL
**Format:** `tak://com.atakmap.app/enroll`

#### Handler: CotMapComponent.java
```java
if ("com.atakmap.app/enroll".equals(u.getHost() + u.getPath())) {
    final String host = u.getQueryParameter("host");
    final String username = u.getQueryParameter("username");
    final String token = u.getQueryParameter("token");
    
    // Shows dialog to user
    ad.setMessage(String.format(LocaleUtil.getCurrent(), 
        context.getString(R.string.quick_enrollment_question), 
        username, host));
    
    // On confirmation, calls:
    CertificateEnrollmentClient.getInstance().onEnrollmentOk(
        context, host, "", host, username, token, -1L);
}
```

**Parameters:**
- `host` (required) - Server hostname/IP, **or connect string** in `host:port:protocol` format
- `username` (required) - Username for authentication
- `token` (required) - Password/token

The `host` value is passed directly to `CertificateEnrollmentClient.onEnrollmentOk()` which splits on `:` to extract host, port (default 8089), and protocol (only `quic` accepted; all else → `ssl`). Source: `CertificateEnrollmentClient.java:771-787` (ATAK CIV 5.5.0.0).

**Examples:**
```
tak://com.atakmap.app/enroll?host=server.example.com&username=user1&token=password123
tak://com.atakmap.app/enroll?host=server.example.com:8090:quic&username=user1&token=password123
```

### 2. Import URL
**Format:** `tak://com.atakmap.app/import`

#### Handler: ImportExportMapComponent.java
```java
if ("com.atakmap.app/import".equals(u.getHost() + u.getPath())) {
    String importUrlString = u.getQueryParameter("url");
    if (importUrlString == null) {
        return;
    }
    final Uri importUrl = Uri.parse(importUrlString);
    
    // Shows dialog to user
    ad.setMessage(context.getString(R.string.import_string) + " " + importUrl);
    
    // On confirmation, calls:
    ImportExportMapComponent.this.beginImport(importUrl);
}
```

**Parameters:**
- `url` (required) - URL of resource to import

**Example:**
```
tak://com.atakmap.app/import?url=https://server.com/data/mission.zip
```

### 3. Preference URL
**Format:** `tak://com.atakmap.app/preference`

#### Handler: PreferenceControl.java
```java
if ("com.atakmap.app/preference".equals(u.getHost() + u.getPath())) {
    // Shows dialog to user
    ad.setMessage(context.getString(R.string.apply_config_question, 
        "an external source"));
    
    // On confirmation, calls:
    PreferenceControl.this.generateUserRequest(u);
}

// generateUserRequest processes multiple parameters:
public void generateUserRequest(Uri uri) {
    Set<String> params = uri.getQueryParameterNames();
    for (String param : params) {
        if (param.startsWith("key")) {
            String index = param.replace("key", "");
            String key = uri.getQueryParameter(param);
            String value = uri.getQueryParameter("value" + index);
            String type = uri.getQueryParameter("type" + index);
            // Applies preference changes
        }
    }
}
```

**Parameters:**
- `key[N]` - Preference key name (where N is a number)
- `value[N]` - Preference value
- `type[N]` - Preference type (string, boolean, int, etc.)

**Example:**
```
tak://com.atakmap.app/preference?key1=atakMapTheme&value1=dark&type1=string&key2=showGrid&value2=true&type2=boolean
```

## CertificateEnrollmentClient Connection Processing

### Default Values and Connection String Parsing
```java
public void onEnrollmentOk(Context context, String address, String cacheCreds, 
                          String description, String username, String password, 
                          Long expiration) {
    // Remove protocol prefix if present
    if (address.contains("://")) {
        address = address.substring(address.indexOf("://") + 3);
    }
    
    // Parse host:port:protocol format
    String[] split = address.split(":");
    String host = split[0];
    
    // DEFAULT PORT: 8089
    int port = split.length > 1 ? Parsers.parseInt(split[1], 8089) : 8089;
    
    // DEFAULT PROTOCOL: "ssl"
    String protocol = "ssl";
    
    // Check for QUIC protocol specification
    if (split.length > 2 && "quic".equalsIgnoreCase(split[2])) {
        protocol = split[2];
    }
    
    // Build connection string
    String connectString = host + ":" + port + ":" + protocol;
    
    // Create bundle for TAK Server
    Bundle bundle = new Bundle();
    bundle.putString(TAKServer.CONNECT_STRING_KEY, connectString);
    bundle.putString(TAKServer.DESCRIPTION_KEY, description);
}
```

## Protocol Support Evidence

### 1. OkHttp3 Protocol Enum
```java
// okhttp3/Protocol.java
public enum Protocol {
    HTTP_1_0("http/1.0"),
    HTTP_1_1("http/1.1"),
    SPDY_3("spdy/3.1"),
    HTTP_2("h2"),
    H2_PRIOR_KNOWLEDGE("h2_prior_knowledge"),
    QUIC("quic");  // QUIC is defined but not accessible via enrollment URLs
}
```

### 2. CommonCommo Transport Layer
```java
// com/atakmap/commoncommo/StreamingTransport.java
public enum StreamingTransport {
    TCP(0),
    SSL(1),
    QUIC(2);  // QUIC has value 2 in native layer
    
    private final int transport;
    
    int getNativeVal() {
        return this.transport;
    }
}
```

## URL Scheme Limitations

### What CAN be specified in TAK:// URLs:
1. **Enrollment (`/enroll`):**
   - `host` — hostname, or connect string `host:port:protocol` (e.g., `server.com:8090:quic`)
   - `username`
   - `token`

2. **Import (`/import`):**
   - `url`

3. **Preferences (`/preference`):**
   - Multiple key/value/type triplets

### What CANNOT be specified:
1. **Certificate paths** — must use data packages for cert distribution
2. **Advanced connection settings** (multiple servers, callsign, team, role) — use data packages
3. **TCP protocol** — only `ssl` (default) and `quic` are supported via enrollment URL

## Connection String Format (Data Packages Only)

When using data packages (NOT enrollment URLs), the full connection string format is:
```
host:port:protocol
```

Examples:
- `server.example.com:8089:ssl` - Standard SSL connection
- `server.example.com:8090:quic` - QUIC connection
- `192.168.1.100:8087:tcp` - Plain TCP connection

## Key Constants and Defaults

### Port Defaults (from TAK Server BaseConnections.java)
- **8087**: TCP/UDP
- **8088**: STCP (Streaming TCP)
- **8089**: SSL/TLS (Default for enrollment)
- **8090**: Authenticated TLS/QUIC
- **8443**: HTTPS web interface
- **8446**: Certificate enrollment HTTPS

### Protocol Values
- `tcp` - Plain TCP
- `udp` - UDP
- `ssl` - SSL/TLS (default)
- `tls` - TLS (treated same as SSL)
- `quic` - QUIC protocol
- `stcp` - Streaming TCP

## Intent and Broadcast Details

### ONSTART_URI Broadcast
- **Action:** `com.atakmap.app.ONSTART_URI`
- **Extra:** `ImportReceiver.EXTRA_URI` (Uri object)
- **Receivers:**
  - CotMapComponent (enrollment)
  - ImportExportMapComponent (import)
  - PreferenceControl (preferences)

## Security Considerations

1. **User Confirmation Required**: All URL schemes show a dialog requiring user confirmation
2. **No Silent Operations**: Cannot execute actions without user interaction
3. **Limited Scope**: Only specific operations are supported
4. **No Direct Data Access**: Cannot directly access or modify user data

## Testing URL Schemes

### Android Intent Testing
```bash
# Test enrollment URL
adb shell am start -a android.intent.action.VIEW \
  -d "tak://com.atakmap.app/enroll?host=server.com&username=test&token=pass"

# Test import URL  
adb shell am start -a android.intent.action.VIEW \
  -d "tak://com.atakmap.app/import?url=https://server.com/data.zip"

# Test preference URL
adb shell am start -a android.intent.action.VIEW \
  -d "tak://com.atakmap.app/preference?key1=theme&value1=dark&type1=string"
```

## Version-Specific Notes

### ATAK 5.1.0.6
- Added: "allow caller to specify protocol in connection string for Quick Connect"
- Note: This refers to manual connection string entry, NOT URL scheme parameters

### ATAK 5.5.0.0 (Current Analysis)
- Enrollment URLs still limited to host/username/token
- QUIC protocol supported but only via data packages
- Default port 8089 hardcoded for enrollment

## Recommendations for Future ATAK Versions

To support QUIC via enrollment URLs, ATAK would need to:

1. **Modify CotMapComponent.java** to extract additional parameters:
```java
// Proposed enhancement
final String port = u.getQueryParameter("port");
final String protocol = u.getQueryParameter("protocol");
```

2. **Update onEnrollmentOk call** to pass full connection info:
```java
// Proposed change
String connectString = host + ":" + (port != null ? port : "8089") + 
                      ":" + (protocol != null ? protocol : "ssl");
CertificateEnrollmentClient.getInstance().onEnrollmentOk(
    context, connectString, "", description, username, token, -1L);
```

## Summary

The TAK:// URL scheme is intentionally limited for security and simplicity. While ATAK supports QUIC protocol internally, it cannot be specified via enrollment URLs due to the current implementation only extracting host, username, and token parameters. Full connection configuration (including QUIC) requires data packages with proper connection strings in the format `host:port:protocol`.