// ATAK Enrollment QR
function generateAtakEnroll({ host, username, token }) {
  if (!host || !username || !token) return '';
  return `tak://com.atakmap.app/enroll?host=${encodeURIComponent(host)}&username=${encodeURIComponent(username)}&token=${encodeURIComponent(token)}`;
}

// ATAK Import QR
function generateAtakImport({ url }) {
  if (!url) return '';
  return `tak://com.atakmap.app/import?url=${encodeURIComponent(url)}`;
}

// ATAK Preference QR (multi-key)
function generateAtakPreference(prefs) {
  if (!Array.isArray(prefs) || prefs.length === 0) return '';
  let params = prefs.map((pref, i) =>
    `key${i+1}=${encodeURIComponent(pref.key)}&type${i+1}=${encodeURIComponent(pref.type)}&value${i+1}=${encodeURIComponent(pref.value)}`
  ).join('&');
  return `tak://com.atakmap.app/preference?${params}`;
}

// iTAK Quick Connect CSV
function generateItakQuickConnect({ description, host, port, protocol }) {
  if (!description || !host || !port || !protocol) return '';
  return `${description},${host},${port},${protocol}`;
}

module.exports = {
  generateAtakEnroll,
  generateAtakImport,
  generateAtakPreference,
  generateItakQuickConnect
}; 