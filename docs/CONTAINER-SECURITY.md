# Container Security Scanning

This project uses industry-standard security scanning tools to ensure container safety.

## Scanning Tools

### 1. Trivy (Primary Scanner)
- **What**: Industry-leading container vulnerability scanner by Aqua Security
- **Coverage**: OS packages, application dependencies, secrets, misconfigurations
- **Speed**: Very fast (seconds)
- **Accuracy**: >95% detection rate with low false positives

### 2. Grype (Validation Scanner)
- **What**: Accuracy-focused scanner by Anchore
- **Focus**: Minimal false positives
- **Best For**: Critical release validation

### 3. SBOM Generation
- **Syft**: Creates Software Bill of Materials
- **Formats**: SPDX and CycloneDX

## Local Scanning

```bash
# Build the container
npm run build:docker

# Run Trivy scan
npm run scan:trivy

# Run Grype scan (requires grype installed)
npm run scan:grype

# Run both scanners
npm run scan:all

# Generate SBOM (requires syft installed)
npm run sbom:generate
```

## Installing Scanners

```bash
# Install Trivy
brew install aquasecurity/trivy/trivy
# or
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin

# Install Grype
brew install grype
# or
curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin

# Install Syft (for SBOM)
brew install syft
# or
curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin
```

## CI/CD Integration

The workflow `.github/workflows/docker-security-scan.yml`:
- Runs automatically on Dockerfile changes
- Scans with both Trivy and Grype
- Uploads results to GitHub Security tab
- Generates SBOM artifacts
- Fails build on HIGH/CRITICAL vulnerabilities

## Security Standards

- **Fail on**: CRITICAL and HIGH vulnerabilities
- **Report**: MEDIUM vulnerabilities
- **SBOM**: Generated for every build
- **Results**: Available in GitHub Security tab

## Why These Tools?

1. **Trivy**: Most comprehensive, fast, and accurate
2. **Grype**: Best for minimizing false positives
3. **Both**: Running two scanners ensures maximum coverage
4. **Free**: All tools are completely free and open source
5. **Standard**: These are industry-standard tools used by major organizations