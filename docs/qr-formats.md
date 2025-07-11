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
  | host     | Target TAK Server          | [FQDN or IP address]     |
  | username | TAK credential to be used  | string                   |
  | token    | TAK token/password         | string                   |

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

iTAK does not use the `tak://` URI scheme for enrollment. Instead, it supports a plain CSV string for Quick Connect.

### 2.1 Quick Connect (CSV)
- **Format:**
  ```
  {serverDescription},{serverURL},{port},{protocol}
  ```
- **Example:**
  ```
  My TAK Server,tictak.ddns.network,8089,ssl
  ```
- **Fields:**
  | Name             | Description                  | Acceptable Values         |
  |------------------|------------------------------|--------------------------|
  | serverDescription| Human-friendly server name    | string                   |
  | serverURL        | TAK server FQDN or IP        | string                   |
  | port             | Server port                  | integer (e.g., 8089)     |
  | protocol         | Protocol                     | ssl (for HTTPS), tcp (for HTTP) |

- **Usage:**
  - The user will be prompted for credentials after scanning.
  - This QR code is not a URI; it is a plain text CSV.

---

## 3. Best Practices & Warnings
- **Always test QR codes with the target TAK client version.**
- **Never share QR codes with credentials in insecure environments.**
- **Percent-encode all URLs for import QR codes.**
- **Preference QR codes can set multiple keys at once.**
- **Keep this document updated with TAK client changes.**

---

## 4. References
- [ATAK 5.2 Change Log - QR Code Support](https://wiki.tak.gov/display/DEV/ATAK+Change+Log+18+July+2024+Version+5.2) - Official QR code specification
- [ATAK Community Wiki](https://github.com/deptofdefense/AndroidTacticalAssaultKit-CIV/wiki)
- [myTeckNet QR Code Registrations with TAK](https://mytecknet.com/tak-qr-codes/)
- [ASCII Encoding Reference](https://www.w3schools.com/tags/ref_urlencode.ASP)

---

## 5. Versioning
- **Based on**: ATAK 5.2 Official Change Log (July 2024)
- **Compatibility**: ATAK 5.2+ (QR code support officially added in this version)
- **Last Updated**: July 2025
- This document should be updated if TAK client QR code formats change in future releases. 