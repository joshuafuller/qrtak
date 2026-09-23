# QR payload formats

This page describes the payloads qrtak generates. ATAK behavior was checked against the local ATAK CIV source; the iTAK section describes qrtak's emitted Quick Connect format and still needs validation against each target iTAK release.

## ATAK enrollment

qrtak generates:

    tak://com.atakmap.app/enroll?host={host}&username={username}&token={token}

Each value is percent-encoded. ATAK reads the host, username, and token query parameters. The qrtak enrollment form accepts a hostname or IP address and uses the server's default stream endpoint.

ATAK's enrollment client defaults the stream connection to port 8089 and protocol ssl. Its host parser also accepts a connect string such as server.example:8090:quic; only quic selects a non-default protocol. qrtak's enrollment form does not expose that custom connect-string input. The Package Builder does expose custom port and protocol settings.

The stream connection and certificate-enrollment API use different ports. The checked TAK Server example configuration sets the stream input to 8089 and the certificate-enrollment HTTPS connector to 8446; deployments may configure different ports.

## ATAK package import

qrtak generates:

    tak://com.atakmap.app/import?url={percent-encoded-url}

ATAK reads the url parameter, asks the user to confirm, then starts importing that URI. qrtak accepts absolute HTTP or HTTPS URLs and does not fetch them itself.

## ATAK preference

The Preferences tab generates repeating key, type, and value parameters:

    tak://com.atakmap.app/preference?key1={key}&type1={type}&value1={value}

The app offers string, boolean, long, and int values. qrtak encodes each parameter value before placing it in the URI.

## iTAK Quick Connect

qrtak emits a four-field CSV payload:

    {description},{host},{port},{protocol}

The app maps HTTPS to ssl and HTTP to tcp, and replaces commas in the description with spaces. This section records qrtak's output format; the local source audit covered ATAK CIV, not iTAK. Confirm behavior on the target iTAK version before distribution.

## Handling credentials

Enrollment QR codes contain the username and token in encoded query parameters. Percent-encoding does not encrypt them. Avoid displaying or sharing credential-bearing QR codes where others can capture them.
