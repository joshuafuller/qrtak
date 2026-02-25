# TAK Onboarding Platform: QR Code Format Specification

This document defines the exact QR code payload formats supported by the TAK Onboarding Platform for interoperability with ATAK and iTAK clients. It is based on official documentation and community best practices (see references).

---

## 1. ATAK (Android TAK) QR Code Formats

ATAK 5.1+ supports QR code onboarding using the `tak://` URI scheme. There are three main QR code types:

### 1.1 Enrollment QR
- **Format:**
  ```
  tak://com.atakmap.app/enroll?host={host}&username={username}&token={token}
  ```
- **Example:**
  ```
  tak://com.atakmap.app/enroll?host=takserver.com&username=john.doe&token=SuperSecret123
  ```
- **Official ATAK 5.2 Example:**
  ```
  tak://com.atakmap.app/enroll?host=takserver.com&username=foo&token=user_token
  ```
- **Fields:**
  | Name     | Description                | Acceptable Values         |
  |----------|----------------------------|--------------------------|
  | host     | TAK Server — hostname/IP, or connect string `host:port` or `host:port:quic` | FQDN, IP, or connect string |
  | username | TAK credential to be used  | string                   |
  | token    | TAK token/password         | string                   |

- **Connect string examples for `host`:**
  ```
  host=server.com                 → server.com:8089:ssl  (defaults)
  host=server.com:8090            → server.com:8090:ssl
  host=server.com:8090:quic       → server.com:8090:quic
  ```
  Only `quic` is accepted as an explicit protocol; all other values fall back to `ssl`.
  Source: `CertificateEnrollmentClient.java:771-787` (ATAK CIV 5.5.0.0)

- **Security Warning:** Credentials are passed in plaintext. Use only in controlled environments with proper SOPs and auditing.

### 1.2 Import QR
- **Format:**
  ```
  tak://com.atakmap.app/import?url={url}
  ```
- **Example:**
  ```
  tak://com.atakmap.app/import?url=https%3A%2F%2Fdomain%2Fpath%2Fto%2Ffile%2Fdatapackage.zip
  ```
- **Official ATAK 5.2 Example:**
  ```
  tak://com.atakmap.app/import?url=http%3A%2F%2Fwebaddress.com%2Ffile%2Ffile.zip
  ```
- **Fields:**
  | Name | Description | Acceptable Values |
  |------|-------------|------------------|
  | url  | URL-encoded link to data package or config file | string (URL-encoded) |

- **Encoding Note:** The URL must be percent-encoded (e.g., `https://` → `https%3A%2F%2F`).

### 1.3 Preference QR
- **Format:**
  ```
  tak://com.atakmap.app/preference?key1={key}&type1={type}&value1={value}[&key2=...]
  ```
- **Example (multi-key):**
  ```
  tak://com.atakmap.app/preference?key1=locationTeam&type1=string&value1=Dark%20Blue&key2=atakRoleType&type2=string&value2=Team%20Member&key3=coord_display_pref&type3=string&value3=UTM&key4=alt_display_agl&type4=boolean&value4=true
  ```
- **Official ATAK 5.2 Example:**
  ```
  tak://com.atakmap.app/preference?key1=displayRed&type1=boolean&value1=true&key2=displayGreen&type2=boolean&value2=true
  ```
- **Fields:**
  | Name      | Description                | Acceptable Values           |
  |-----------|----------------------------|----------------------------|
  | key[n]    | Preference key             | string                     |
  | type[n]   | Preference key type        | string, boolean, long, int |
  | value[n]  | Value for the preference   | string                     |

- **Usage:** Use for setting preferences post-enrollment (e.g., team color, role, coordinate display).

---

## 2. iTAK (iOS TAK) QR Code Format

iTAK does not use the `tak://` URI scheme for server onboarding. It scans a plain CSV string known as “Quick Connect”.

### 2.1 Quick Connect (CSV)
- **Format (strictly 4 fields, in order):**
  ```
  {description},{host},{port},{protocol}
  ```
- **Examples (canonical):**
  ```
  My TAK,tak.example.com,8089,ssl
  My TAK,192.168.1.10,8089,tcp
  ```
- **Fields:**
  | Name        | Description                    | Rules                                  |
  |-------------|--------------------------------|----------------------------------------|
  | description | Human-friendly server name     | UTF‑8; no commas; avoid control chars  |
  | host        | TAK server FQDN or IPv4        | IPv6 typically not supported via CSV   |
  | port        | Server port                    | Required; 1–65535                      |
  | protocol    | Transport                      | `ssl` (SSL/TLS) or `tcp` (plain TCP)   |

- **Important constraints:**
  - Exactly 4 comma-separated fields; no extra/missing fields.
  - No quoting/escaping: descriptions must not contain commas.
  - Trim whitespace in generator; emit plain UTF‑8 (no BOM), no trailing newline required.
  - Protocol tokens are case-insensitive, but generators should emit lower-case `ssl`/`tcp`.
  - iTAK prompts for username/password after scanning; CSV carries connection info only.
  - QUIC is not supported in iTAK Quick Connect CSV.

- **Non-examples (invalid):**
  ```
  # Missing port
  My TAK,tak.example.com,ssl

  # Unsupported protocol
  My TAK,tak.example.com,8090,quic

  # Comma in description breaks parsing
  Team, One,tak.example.com,8089,ssl
  ```

> Note: If you need advanced options (e.g., certificates, QUIC, custom provisioning), use data packages rather than CSV QR.

---

## 3. Best Practices & Warnings
- **Always test QR codes with the target TAK client version.**
- **Never share QR codes with credentials in insecure environments.**
- **Percent-encode all URLs for import QR codes.**
- **Preference QR codes can set multiple keys at once.**
- **Keep this document updated with TAK client changes.**

---

## 4. References
- [ATAK Scheme Handling aka "tak://"](https://wiki.tak.gov/spaces/DEV/pages/125370826/ATAK+Scheme+Handling+aka+tak)
- [ATAK Community Wiki](https://github.com/deptofdefense/AndroidTacticalAssaultKit-CIV/wiki)
- [myTeckNet QR Code Registrations with TAK](https://mytecknet.com/tak-qr-codes/)
- [ASCII Encoding Reference](https://www.w3schools.com/tags/ref_urlencode.ASP)

---

## 5. Versioning
- **Based on**: ATAK 5.2 Official Change Log (July 2024) and iTAK Quick Connect guidance
- **Compatibility**: ATAK 5.2+; iTAK Quick Connect CSV in current iTAK releases
- **Last Updated**: September 2025
- This document should be updated if TAK client QR code formats change in future releases. 
