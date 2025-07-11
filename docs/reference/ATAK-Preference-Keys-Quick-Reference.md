# ATAK Preference Keys Quick Reference

## Overview

This quick reference guide provides the most commonly used ATAK preference keys organized by category. For detailed specifications, see the full [Technical Specification](ATAK-Preference-Keys-Technical-Specification.md).

## Quick Start

### Basic QR Code Format
```
tak://com.atakmap.app/preference?key1={key}&type1={type}&value1={value}&key2={key}&type2={type}&value2={value}...
```

### Data Types
- **string**: Text values
- **boolean**: `true` or `false`
- **int/long**: Numeric values

---

## Identity & Team Settings

| Preference Key | Type | Common Values | Description |
|----------------|------|---------------|-------------|
| `locationCallsign` | string | `"ALPHA-01"` | User's callsign |
| `locationTeam` | string | `"Dark Blue"`, `"Red"`, `"Green"` | Team color |
| `atakRoleType` | string | `"Team Member"`, `"Team Lead"`, `"Medic"` | Operational role |
| `locationUnitType` | string | `"Ground Troop"`, `"Armored Vehicle"` | Unit display type |

### Team Colors Available
- White, Yellow, Orange, Magenta
- Red, Maroon, Purple, Dark Blue
- Blue, Cyan, Teal, Green, Dark Green, Brown

### Role Types Available
- Team Member, Team Lead, HQ
- Sniper, Medic, Forward Observer
- RTO, K9

---

## Display & UI Settings

| Preference Key | Type | Common Values | Description |
|----------------|------|---------------|-------------|
| `coord_display_pref` | string | `"MGRS"`, `"UTM"`, `"DD"`, `"DM"`, `"DMS"` | Coordinate format |
| `alt_display_pref` | string | `"HAE"`, `"MSL"` | Altitude reference |
| `alt_unit_pref` | string | `"0"` (feet), `"1"` (meters) | Altitude units |
| `alt_display_agl` | boolean | `true`, `false` | Show AGL altitude |
| `map_zoom_visible` | boolean | `true`, `false` | Show zoom controls |
| `map_scale_visible` | boolean | `true`, `false` | Show map scale |
| `largeTextMode` | boolean | `true`, `false` | Large text mode |
| `largeActionBar` | boolean | `true`, `false` | Large toolbar |

---

## Network & Connectivity

| Preference Key | Type | Common Values | Description |
|----------------|------|---------------|-------------|
| `dispatchLocationCotExternal` | boolean | `true`, `false` | Broadcast location |
| `dispatchLocationHidden` | boolean | `true`, `false` | Hide position |
| `displayServerConnectionWidget` | boolean | `true`, `false` | Show connection widget |
| `enableNonStreamingConnections` | boolean | `true`, `false` | Enable mesh mode |
| `monitorServerConnections` | boolean | `true`, `false` | Monitor connections |

---

## GPS & Location

| Preference Key | Type | Common Values | Description |
|----------------|------|---------------|-------------|
| `mockingOption` | string | `"LocalGPS"`, `"WRGPS"`, `"IgnoreInternalGPS"` | GPS source |
| `useGPSTime` | boolean | `true`, `false` | Use GPS time |
| `locationReportingStrategy` | string | `"Dynamic"`, `"Constant"` | Update strategy |
| `useTerrainElevationSelfMarker` | boolean | `true`, `false` | Use terrain elevation |

### GPS Options
- `"LocalGPS"` = Internal GPS Only
- `"WRGPS"` = External/Network GPS with fallback
- `"IgnoreInternalGPS"` = External/Network GPS only

---

## Communication

| Preference Key | Type | Common Values | Description |
|----------------|------|---------------|-------------|
| `saHasPhoneNumber` | boolean | `true`, `false` | Publish phone number |
| `saSipAddress` | string | `"No VOIP"`, `"Manual Entry"` | VoIP configuration |
| `saXmppUsername` | string | `"user123"` | XMPP username |
| `saEmailAddress` | string | `"user@domain.com"` | Email address |
| `saURN` | string | `"12345"` | Unit reference number |

---

## Tools & Features

| Preference Key | Type | Common Values | Description |
|----------------|------|---------------|-------------|
| `atakControlBluetooth` | boolean | `true`, `false` | Enable Bluetooth |
| `nonBluetoothLaserRangeFinder` | boolean | `true`, `false` | Non-BT LRF support |
| `autostart_nineline` | boolean | `true`, `false` | Auto-start 9-line |
| `keyhole_cas` | boolean | `true`, `false` | Use Keyhole CAS |
| `enableGeocoder` | boolean | `true`, `false` | Enable address lookup |

---

## Route & Navigation

| Preference Key | Type | Common Values | Description |
|----------------|------|---------------|-------------|
| `waypointPrefix` | string | `"CP"` | Checkpoint prefix |
| `route_track_up_locked_on` | boolean | `true`, `false` | Traditional navigation |
| `useRouteVoiceCues` | boolean | `true`, `false` | Voice navigation |
| `route_vibrate_at_checkpoint` | boolean | `true`, `false` | Vibrate at checkpoints |

---

## Chat & Notifications

| Preference Key | Type | Common Values | Description |
|----------------|------|---------------|-------------|
| `enableToast` | boolean | `true`, `false` | Show notifications |
| `vibratePhone` | boolean | `true`, `false` | Vibrate notifications |
| `audibleNotify` | boolean | `true`, `false` | Sound notifications |
| `alert_notification` | boolean | `true`, `false` | Alert notifications |

---

## Common Configuration Examples

### Basic Team Setup
```
tak://com.atakmap.app/preference?key1=locationCallsign&type1=string&value1=ALPHA-01&key2=locationTeam&type2=string&value2=Dark Blue&key3=atakRoleType&type3=string&value3=Team Member
```

### Display Configuration (UTM + Meters)
```
tak://com.atakmap.app/preference?key1=coord_display_pref&type1=string&value1=UTM&key2=alt_unit_pref&type2=string&value2=1&key3=alt_display_pref&type3=string&value3=HAE
```

### Network Configuration
```
tak://com.atakmap.app/preference?key1=dispatchLocationCotExternal&type1=boolean&value1=true&key2=displayServerConnectionWidget&type2=boolean&value2=true&key3=enableNonStreamingConnections&type3=boolean&value3=false
```

### Accessibility Setup
```
tak://com.atakmap.app/preference?key1=largeTextMode&type1=boolean&value1=true&key2=largeActionBar&type2=boolean&value2=true&key3=enableToast&type3=boolean&value3=true
```

---

## Troubleshooting

### Common Issues

1. **QR Code Too Long**: Break into multiple QR codes or use data packages
2. **Invalid Values**: Check spelling and case sensitivity
3. **Type Mismatches**: Ensure boolean values are `true`/`false`, not `"true"`/`"false"`
4. **URL Encoding**: Spaces and special characters must be encoded

### Validation Tips

- Test configurations in a safe environment first
- Verify preference keys exist in your ATAK version
- Check that values match expected formats
- Monitor ATAK logs for configuration errors

---

## Quick Reference Card

### Essential Preferences
```
Identity: locationCallsign, locationTeam, atakRoleType
Display: coord_display_pref, alt_unit_pref, largeTextMode
Network: dispatchLocationCotExternal, displayServerConnectionWidget
GPS: mockingOption, useGPSTime
Tools: atakControlBluetooth, autostart_nineline
```

### Data Type Quick Check
- **Strings**: Use quotes for enumerated values
- **Booleans**: Use `true` or `false` (no quotes)
- **Numbers**: Use numeric values (no quotes)

---

**Last Updated**: July 10, 2025  
**ATAK Version**: 5.1+  
**For detailed specifications**: See [Technical Specification](ATAK-Preference-Keys-Technical-Specification.md) 