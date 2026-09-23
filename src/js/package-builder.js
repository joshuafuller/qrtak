import JSZip from 'jszip';
import { isValidHostname, isValidPort } from './utils.js';

// ============================================================================
// Data Package Builder Module
// ============================================================================

export const PackageBuilder = (function () {
  let extraFiles = [];
  const validationFields = [
    { id: 'package-host', validator: validateHost, required: true },
    { id: 'package-port', validator: validatePort, required: true },
    { id: 'package-protocol', validator: validateProtocol, required: true },
    { id: 'package-username', validator: validateUsername, required: 'conditional' },
    { id: 'package-password', validator: validatePassword, required: 'conditional' },
    { id: 'package-callsign', validator: validateCallsign, required: false },
    { id: 'package-team', validator: validateTeam, required: false },
    { id: 'package-role', validator: validateRole, required: false },
    { id: 'pkg-ca', validator: validateCaFile, required: true },
    { id: 'package-ca-pass', validator: validateCaPassword, required: true },
    { id: 'pkg-client', validator: validateClientFile, required: 'conditional' },
    { id: 'package-client-pass', validator: validateClientPassword, required: 'conditional' }
  ];

  function init () {
    const form = document.getElementById('package-form');
    if (!form) {
      return;
    }

    const deployment = document.getElementById('package-deployment');
    const clientCertGroup = document.getElementById('client-cert-group');

    // Smart field visibility based on deployment type
    function updateFieldVisibility () {
      const deploymentTypeDesc = document.getElementById('deployment-type-desc');
      const deploymentDesc = document.getElementById('deployment-desc');
      const usernameField = document.getElementById('package-username');
      const passwordField = document.getElementById('package-password');

      if (deployment.value === 'auto-enroll') {
        // Auto-Enrollment: Hide client cert, make username/password required
        clientCertGroup.style.display = 'none';

        // Update help text to indicate username/password are required
        const usernameHelp = usernameField.parentElement.querySelector('.help-text');
        const passwordHelp = passwordField.parentElement.querySelector('.help-text');
        if (usernameHelp) {
          usernameHelp.textContent = 'Username required for certificate enrollment from server';
        }
        if (passwordHelp) {
          passwordHelp.textContent = 'Password required for certificate enrollment';
        }

        // Update deployment description
        if (deploymentTypeDesc) {
          deploymentTypeDesc.textContent = 'Auto-Enrollment:';
        }
        if (deploymentDesc) {
          deploymentDesc.textContent = 'Package contains server info and CA certificate. ATAK prompts for enrollment credentials after import; the package does not include the password.';
        }
      } else {
        // Soft-Certificate: Show client cert, make username/password optional
        clientCertGroup.style.display = '';

        // Update help text to indicate username/password are optional
        const usernameHelp = usernameField.parentElement.querySelector('.help-text');
        const passwordHelp = passwordField.parentElement.querySelector('.help-text');
        if (usernameHelp) {
          usernameHelp.textContent = 'Username for server authentication (optional - uses certificate by default)';
        }
        if (passwordHelp) {
          passwordHelp.textContent = 'Password for additional authentication layer (optional)';
        }

        // Update deployment description
        if (deploymentTypeDesc) {
          deploymentTypeDesc.textContent = 'Soft-Certificate:';
        }
        if (deploymentDesc) {
          deploymentDesc.textContent = 'Package includes a pre-generated client certificate. If server authentication is enabled, ATAK may prompt for credentials after import; the package does not include the password.';
        }
      }

      // Update package name preview when deployment type changes
      updatePackageNamePreview();
    }

    // Set up event listener and initial state
    deployment?.addEventListener('change', updateFieldVisibility);

    // Initialize field visibility
    setTimeout(updateFieldVisibility, 0);

    // Set up real-time validation
    setupRealTimeValidation();

    // Set up drag and drop functionality
    const dropzone = document.getElementById('package-dropzone');
    const fileInput = document.getElementById('pkg-extra');
    const filesList = document.getElementById('package-files-list');

    function updateFilesList () {
      if (!filesList) {
        return;
      }
      if (extraFiles.length === 0) {
        filesList.textContent = 'No files selected';
        return;
      }
      filesList.textContent = `${extraFiles.length} file(s) selected`;
    }

    dropzone?.addEventListener('click', () => fileInput?.click());
    dropzone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
    dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone?.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (!e.dataTransfer) {
        return;
      }
      extraFiles.push(...Array.from(e.dataTransfer.files));
      updateFilesList();
    });
    fileInput?.addEventListener('change', (e) => {
      const { target } = e;
      if (target?.files) {
        extraFiles.push(...Array.from(target.files));
        updateFilesList();
      }
    });

    document.getElementById('package-reset')?.addEventListener('click', () => {
      extraFiles = [];
      if (fileInput) {
        fileInput.value = '';
      }
      updateFilesList();
      form.reset();
      updatePackageNamePreview(); // Update preview after reset
    });

    document.getElementById('package-build')?.addEventListener('click', buildPackage);

    // Set up dynamic package name preview
    setupDynamicNaming();

    // Set up QUIC port auto-switching for package form
    setupPackageQuicSwitching();
  }

  /**
   * Setup real-time validation for package form fields
   */
  function setupRealTimeValidation () {
    // Add event listeners for real-time validation
    validationFields.forEach(fieldConfig => {
      const field = document.getElementById(fieldConfig.id);
      if (field) {
        // Add validation on input/change
        field.addEventListener('input', () => validateField(fieldConfig));
        field.addEventListener('change', () => validateField(fieldConfig));
        field.addEventListener('blur', () => validateField(fieldConfig));
      }
    });

    // Also watch for deployment type changes to re-validate
    const deploymentSelect = document.getElementById('package-deployment');
    if (deploymentSelect) {
      deploymentSelect.addEventListener('change', () => {
        validationFields.forEach(validateField);
        updateFieldLabels();
      });
    }

    // Initial validation
    setTimeout(() => {
      validationFields.forEach(validateField);
      updateFieldLabels();
    }, 100);
  }

  /**
   * Validate a single field and update its visual state
   */
  function validateField (fieldConfig) {
    const field = document.getElementById(fieldConfig.id);
    const formGroup = field?.closest('.form-group');

    if (!field || !formGroup) {
      return;
    }

    const deployment = document.getElementById('package-deployment')?.value || 'auto-enroll';
    const isRequired = getFieldRequirement(fieldConfig.required, deployment, fieldConfig.id);
    const value = field.type === 'file' ? field.files?.[0] : field.value;

    // Run field-specific validation
    const isValid = fieldConfig.validator(value, deployment);
    const isEmpty = !value || (typeof value === 'string' && !value.trim());

    // Determine validation state
    let validationState = 'neutral';

    if (isEmpty && isRequired) {
      validationState = 'invalid'; // Required but empty
    } else if (isEmpty && !isRequired) {
      validationState = 'neutral'; // Optional and empty
    } else if (!isEmpty && isValid) {
      validationState = 'valid'; // Has value and valid
    } else if (!isEmpty && !isValid) {
      validationState = 'invalid'; // Has value but invalid
    }

    // Update field classes
    field.classList.remove('field-valid', 'field-invalid');
    formGroup.classList.remove('field-valid', 'field-invalid', 'has-validation');

    if (validationState === 'valid') {
      field.classList.add('field-valid');
      formGroup.classList.add('field-valid', 'has-validation');
    } else if (validationState === 'invalid') {
      field.classList.add('field-invalid');
      formGroup.classList.add('field-invalid', 'has-validation');
    }

    return validationState;
  }

  /**
   * Determine if a field is required based on deployment type
   */
  function getFieldRequirement (requiredConfig, deployment, fieldId) {
    if (requiredConfig === true) {
      return true;
    }
    if (requiredConfig === false) {
      return false;
    }
    if (requiredConfig === 'conditional') {
      // Conditional requirements based on deployment type
      if (deployment === 'auto-enroll') {
        return ['package-username', 'package-password'].includes(fieldId);
      } else if (deployment === 'soft-cert') {
        return ['pkg-client', 'package-client-pass'].includes(fieldId);
      }
    }
    return false;
  }

  /**
   * Update field labels with required/optional indicators
   */
  function updateFieldLabels () {
    const deployment = document.getElementById('package-deployment')?.value || 'auto-enroll';

    const labelUpdates = [
      { id: 'package-host', required: true },
      { id: 'package-port', required: true },
      { id: 'package-protocol', required: true },
      { id: 'package-username', required: deployment === 'auto-enroll' },
      { id: 'package-password', required: deployment === 'auto-enroll' },
      { id: 'package-callsign', required: false },
      { id: 'package-team', required: false },
      { id: 'package-role', required: false },
      { id: 'pkg-ca', required: true },
      { id: 'package-ca-pass', required: true },
      { id: 'pkg-client', required: deployment === 'soft-cert' },
      { id: 'package-client-pass', required: deployment === 'soft-cert' }
    ];

    labelUpdates.forEach(({ id, required }) => {
      const field = document.getElementById(id);
      const label = field?.previousElementSibling?.tagName === 'LABEL' ?
        field.previousElementSibling :
        field?.closest('.form-group')?.querySelector('label');

      if (label) {
        label.classList.remove('field-required', 'field-optional');
        label.classList.add(required ? 'field-required' : 'field-optional');
      }
    });
  }

  // Field-specific validation functions
  function validateHost (value) {
    return value && isValidHostname(value);
  }

  function validatePort (value) {
    return value && isValidPort(value);
  }

  function validateProtocol (value) {
    const client = document.getElementById('package-client')?.value || 'atak';
    const allowed = client === 'itak' ? ['ssl', 'tcp'] : ['ssl', 'tcp', 'quic'];
    return value && allowed.includes(value);
  }

  function validateUsername (value, deployment) {
    if (deployment === 'auto-enroll') {
      return value && value.trim().length >= 2;
    }
    return !value || value.trim().length >= 2; // Optional but must be valid if provided
  }

  function validatePassword (value, deployment) {
    if (deployment === 'auto-enroll') {
      return value && value.length >= 4;
    }
    return !value || value.length >= 4; // Optional but must be valid if provided
  }

  function validateCallsign (value) {
    return !value || (value.trim().length >= 2 && value.trim().length <= 20);
  }

  function validateTeam () {
    return true; // Team dropdown is always valid
  }

  function validateRole () {
    return true; // Role dropdown is always valid
  }

  function validateCaFile (value) {
    return value instanceof File && value.name.endsWith('.p12');
  }

  function validateCaPassword (value) {
    return value && value.length >= 1;
  }

  function validateClientFile (value, deployment) {
    if (deployment === 'soft-cert') {
      return value instanceof File && value.name.endsWith('.p12');
    }
    return true; // Not required for auto-enroll
  }

  function validateClientPassword (value, deployment) {
    if (deployment === 'soft-cert') {
      return value && value.length >= 1;
    }
    return true; // Not required for auto-enroll
  }

  /**
   * Check if all required fields are valid for package building
   */
  function validatePackageForm () {
    const deployment = document.getElementById('package-deployment')?.value || 'auto-enroll';

    for (const fieldConfig of validationFields) {
      const field = document.getElementById(fieldConfig.id);
      const required = getFieldRequirement(fieldConfig.required, deployment, fieldConfig.id);
      if (!field) {
        if (required) {
          return false;
        }
        continue;
      }

      const value = field.type === 'file' ? field.files?.[0] : field.value;
      const isEmpty = !value || (typeof value === 'string' && !value.trim());
      if ((required && isEmpty) || (!isEmpty && !fieldConfig.validator(value, deployment))) {
        return false;
      }
    }

    return true;
  }

  /**
   * Setup dynamic package name preview that updates as user types
   */
  function setupDynamicNaming () {
    const nameInput = document.getElementById('package-name');
    if (!nameInput) {
      return;
    }

    // Fields that affect the package name
    const watchFields = [
      'package-host',
      'package-username',
      'package-callsign',
      'package-client',
      'package-team',
      'package-role',
      'package-protocol',
      'package-port',
      'package-deployment'
    ];

    // Update preview when any relevant field changes
    watchFields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.addEventListener('input', updatePackageNamePreview);
        field.addEventListener('change', updatePackageNamePreview);
      }
    });

    // Initial preview update
    updatePackageNamePreview();
  }

  /**
   * Setup QUIC port auto-switching for package form
   */
  function setupPackageQuicSwitching () {
    const protocolSelect = document.getElementById('package-protocol');
    const portInput = document.getElementById('package-port');
    const clientSelect = document.getElementById('package-client');

    if (!protocolSelect || !portInput) {
      return;
    }

    function handlePackageProtocolChange () {
      const selectedProtocol = protocolSelect.value;
      const client = clientSelect?.value || 'atak';

      if (client === 'itak' && selectedProtocol === 'quic') {
        protocolSelect.value = 'ssl';
      }

      if (protocolSelect.value === 'quic') {
        portInput.value = '8090';
      } else if (protocolSelect.value === 'ssl') {
        portInput.value = '8089';
      } else if (protocolSelect.value === 'tcp') {
        portInput.value = '8087';
      }

      // Update package name preview when protocol changes
      updatePackageNamePreview();
    }

    // Set up event listener
    protocolSelect.addEventListener('change', handlePackageProtocolChange);

    // If client switches to iTAK, force protocol away from QUIC and hide option
    if (clientSelect) {
      clientSelect.addEventListener('change', () => {
        const isITAK = clientSelect.value === 'itak';
        const quicOption = protocolSelect.querySelector('option[value="quic"]');
        if (isITAK) {
          if (protocolSelect.value === 'quic') {
            protocolSelect.value = 'ssl';
            portInput.value = '8089';
          }
          if (quicOption) {
            quicOption.disabled = true;
            quicOption.hidden = true;
          }
        } else if (quicOption) {
          quicOption.disabled = false;
          quicOption.hidden = false;
        }
        // Re-trigger protocol validation so CSS reflects the current value
        protocolSelect.dispatchEvent(new Event('change'));
        updatePackageNamePreview();
      });
    }
  }

  /**
   * Update the package name input with dynamic preview
   */
  function updatePackageNamePreview () {
    const nameInput = document.getElementById('package-name');
    if (!nameInput) {
      return;
    }

    // Get current form values
    const host = document.getElementById('package-host')?.value?.trim() || '';
    const callsign = document.getElementById('package-callsign')?.value?.trim() || '';
    const client = document.getElementById('package-client')?.value || 'atak';
    const team = document.getElementById('package-team')?.value?.trim() || '';
    const role = document.getElementById('package-role')?.value?.trim() || '';
    const proto = document.getElementById('package-protocol')?.value || 'ssl';
    const port = document.getElementById('package-port')?.value?.trim() || '';

    // Generate dynamic name
    const dynamicName = generatePackageName({
      host,
      callsign,
      client,
      team,
      role,
      protocol: proto,
      port
    });

    // If the input is empty or contains the old default, update with dynamic name
    const currentValue = nameInput.value.trim();
    if (!currentValue || currentValue === 'TAK_Server.zip' || currentValue.endsWith('-package.zip')) {
      nameInput.value = dynamicName;
    }

    // Always update placeholder to show what the dynamic name would be
    nameInput.placeholder = `Auto-generated: ${dynamicName}`;
  }

  /**
   * Generate dynamic package name based on server and client details
   */
  function generatePackageName ({ host, callsign, client, team, role, protocol }) {
    // Sanitize string for filename safety
    function sanitizeForFilename (str) {
      if (!str) {
        return '';
      }
      return str
        .toLowerCase()
        .replace(/[^a-z0-9-_.]/g, '-')  // Replace invalid chars with dash
        .replace(/--+/g, '-')          // Collapse multiple dashes
        .replace(/^-|-$/g, '');        // Remove leading/trailing dashes
    }

    // Preserve full hostname (FQDN) but sanitize for filename
    function cleanHostname (hostname) {
      if (!hostname) {
        return '';
      }

      // Keep the full hostname but sanitize it for filename safety
      return sanitizeForFilename(hostname);
    }

    // Build name parts
    const parts = [];

    // Always start with hostname
    const cleanHost = cleanHostname(host);
    parts.push(cleanHost || 'tak-server');

    // Add callsign if provided
    if (callsign?.trim()) {
      parts.push(sanitizeForFilename(callsign));
    }

    // Always add client type
    parts.push(client || 'atak');

    // Add team if provided and it's not just a color
    if (team?.trim() && team.toLowerCase() !== 'none') {
      const cleanTeam = sanitizeForFilename(team);
      if (cleanTeam) {
        parts.push(cleanTeam);
      }
    }

    // Add role if provided
    if (role?.trim() && role.toLowerCase() !== 'none') {
      const cleanRole = sanitizeForFilename(role);
      if (cleanRole) {
        parts.push(cleanRole);
      }
    }

    // Add protocol indicator if it's not standard TCP+TLS
    if (protocol === 'quic' && client !== 'itak') {
      parts.push('quic');
    } else if (protocol === 'tcp') {
      parts.push('tcp');
    }

    // Join parts and add extension
    const baseName = parts.join('-');
    return `${baseName}-package.zip`;
  }

  async function buildPackage () {
    try {
      const client = document.getElementById('package-client').value;
      const deployment = document.getElementById('package-deployment').value;
      const host = document.getElementById('package-host').value.trim();
      const port = document.getElementById('package-port').value.trim();
      const proto = document.getElementById('package-protocol').value;
      const caPass = document.getElementById('package-ca-pass').value;
      const clientPass = document.getElementById('package-client-pass').value;
      const username = document.getElementById('package-username').value.trim();
      const password = document.getElementById('package-password').value;
      const cacheCreds = document.getElementById('package-cache-creds').checked;
      const callsign = document.getElementById('package-callsign').value.trim();
      const team = document.getElementById('package-team').value.trim();
      const role = document.getElementById('package-role').value.trim();

      // Generate dynamic package name based on configuration
      const dynamicName = generatePackageName({
        host,
        callsign,
        client,
        team,
        role,
        protocol: proto,
        port
      });

      // Allow manual override if provided, otherwise use dynamic name
      const manualName = document.getElementById('package-name').value.trim();
      const name = manualName || dynamicName;
      const caFile = document.getElementById('pkg-ca').files?.[0] || null;
      const clientFile = document.getElementById('pkg-client').files?.[0] || null;

      // Use the comprehensive validation system
      if (!validatePackageForm()) {
        window.UIController.showNotification('Please fix the highlighted field errors before building the package', 'error');

        // Scroll to first invalid field
        const firstInvalid = document.querySelector('.field-invalid');
        if (firstInvalid) {
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstInvalid.focus();
        }
        return;
      }

      // Protocol option values (ssl/tcp/quic) map directly to TAK connect string tokens
      const protocolToken = proto;

      const connectString = `${host}:${port}:${protocolToken}`;

      const prefXml = buildConfigPref({
        deployment,
        connectString,
        caPass,
        clientPass,
        username,
        password,
        cacheCreds,
        callsign,
        team,
        role,
        client
      });

      const manifestXml = buildManifest({
        name,
        includeClient: deployment === 'soft-cert',
        includeCA: true,
        client,
        extraFiles
      });

      const zip = new JSZip();

      if (client === 'itak') {
        zip.file('config.pref', prefXml);
        if (caFile) {
          zip.file('caCert.p12', caFile);
        }
        if (deployment === 'soft-cert' && clientFile) {
          zip.file('clientCert.p12', clientFile);
        }
        zip.folder('MANIFEST')?.file('manifest.xml', manifestXml);
      } else {
        zip.folder('certs')?.file('config.pref', prefXml);
        if (caFile) {
          zip.folder('certs')?.file('caCert.p12', caFile);
        }
        if (deployment === 'soft-cert' && clientFile) {
          zip.folder('certs')?.file('clientCert.p12', clientFile);
        }
        zip.folder('MANIFEST')?.file('manifest.xml', manifestXml);
      }

      // Add extra files preserving names
      for (const f of extraFiles) {
        zip.file(f.name, f);
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const filename = name || 'TAK_Server.zip';

      // Download the package
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);

      window.UIController.showNotification(`Package "${filename}" downloaded successfully!`, 'success');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      window.UIController.showNotification('Error building data package', 'error');
    }
  }

  function escapeXml (value) {
    const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&apos;' };
    return String(value).replace(/[&<>"']/g, char => entities[char]);
  }

  function generateUid () {
    if (window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }

    const bytes = window.crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  function buildConfigPref ({ deployment, connectString, caPass, clientPass, username, password, cacheCreds, callsign, team, role, client }) {
    const isSoft = deployment === 'soft-cert';
    const isITAK = client === 'itak';
    const certPathPrefix = isITAK ? '' : 'certs'; // iTAK expects files in root, ATAK uses certs folder

    // Check if QUIC protocol is being used
    const isQUIC = connectString.endsWith(':quic');

    // Authentication and credential entries
    const authEntries = [];

    // Always include CA password — all per-connection keys use index suffix per
    // PreferenceControl.java:564-569 which reads mapping.get("caPassword" + j)
    authEntries.push(`<entry key="caPassword0" class="class java.lang.String">${escapeXml(caPass)}</entry>`);

    // Add username/password if provided
    if (username) {
      authEntries.push(`<entry key="username0" class="class java.lang.String">${escapeXml(username)}</entry>`);
    }

    // Add authentication settings
    if (username && password) {
      authEntries.push('<entry key="useAuth0" class="class java.lang.Boolean">true</entry>');
      const cachePolicy = cacheCreds ? 'Cache credentials' : 'Do not cache';
      authEntries.push(`<entry key="cacheCreds0" class="class java.lang.String">${cachePolicy}</entry>`);
      // Note: Password is not stored in prefs for security - provided during connection
    }

    // Deployment-specific entries — cert keys use index suffix (PreferenceControl.java:564-569)
    const extraSoftEntries = isSoft ?
      `<entry key="clientPassword0" class="class java.lang.String">${escapeXml(clientPass)}</entry>
    <entry key="certificateLocation0" class="class java.lang.String">${certPathPrefix ? `${certPathPrefix}/` : ''}clientCert.p12</entry>` :
      '<entry key="enrollForCertificateWithTrust0" class="class java.lang.Boolean">true</entry>';

    const allAuthEntries = authEntries.join('\n    ');

    // Build optional user entries without empty lines
    const optionalUserEntries = [];
    if (callsign) {
      optionalUserEntries.push(`<entry key="locationCallsign" class="class java.lang.String">${escapeXml(callsign)}</entry>`);
    }
    if (team) {
      optionalUserEntries.push(`<entry key="locationTeam" class="class java.lang.String">${escapeXml(team)}</entry>`);
    }
    if (role) {
      optionalUserEntries.push(`<entry key="atakRoleType" class="class java.lang.String">${escapeXml(role)}</entry>`);
    }
    const optionalUser = optionalUserEntries.length > 0 ? `\n    ${optionalUserEntries.join('\n    ')}` : '';

    return `<?xml version='1.0' encoding='UTF-8' standalone='yes'?>
<preferences>
  <preference version="1" name="cot_streams">
    <entry key="count" class="class java.lang.Integer">1</entry>
    <entry key="description0" class="class java.lang.String">TAK Server</entry>
    <entry key="enabled0" class="class java.lang.Boolean">true</entry>
    <entry key="connectString0" class="class java.lang.String">${escapeXml(connectString)}</entry>
    <entry key="caLocation0" class="class java.lang.String">${certPathPrefix ? `${certPathPrefix}/` : ''}caCert.p12</entry>
    ${allAuthEntries}
    ${extraSoftEntries}
  </preference>
  <preference version="1" name="com.atakmap.app_preferences">
    <entry key="displayServerConnectionWidget" class="class java.lang.Boolean">true</entry>${isQUIC ? '\n    <entry key="network_quic_enabled" class="class java.lang.Boolean">true</entry>' : ''}${optionalUser}
  </preference>
</preferences>`;
  }

  function buildManifest ({ name, includeClient, includeCA, client, extraFiles = [] }) {
    const uid = generateUid();
    const isITAK = client === 'itak';
    const caPath = isITAK ? 'caCert.p12' : 'certs/caCert.p12';
    const clientPath = isITAK ? 'clientCert.p12' : 'certs/clientCert.p12';
    const configPath = isITAK ? 'config.pref' : 'certs/config.pref';
    return `<MissionPackageManifest version="2">
  <Configuration>
    <Parameter name="uid" value="${uid}"/>
    <Parameter name="name" value="${escapeXml(name || 'TAK_Server.zip')}"/>
    <Parameter name="onReceiveDelete" value="true"/>
  </Configuration>
  <Contents>
    <Content ignore="false" zipEntry="${configPath}"/>
    ${includeCA ? `<Content ignore="false" zipEntry="${caPath}"/>` : ''}
    ${includeClient ? `<Content ignore="false" zipEntry="${clientPath}"/>` : ''}
    ${extraFiles.map(file => `<Content ignore="false" zipEntry="${escapeXml(file.name)}"/>`).join('\n    ')}
  </Contents>
</MissionPackageManifest>`;
  }

  return { init, buildPackage };
})();
