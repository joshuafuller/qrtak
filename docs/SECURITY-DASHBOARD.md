# Security scanning

The current [security workflow](../.github/workflows/security.yml) runs on pushes to main, develop, and Release Please branches; pull requests to main and develop; weekly on Sunday at 02:00 UTC; and manual dispatch.

## Checks and reporting

The workflow includes TruffleHog, Semgrep, npm audit, a malicious or critical dependency gate, Snyk, OSV Scanner, Trivy, Grype, and SBOM generation. A separate [Scorecard workflow](../.github/workflows/scorecard.yml) is defined.

Container scanning runs on pushes, manual dispatch, commits whose message contains [docker], and pull requests labeled docker. Trivy and Grype findings are uploaded as SARIF; the container scanners are configured as reporting steps rather than build blockers.

Not every scan blocks a workflow: secret scanning and Semgrep continue on error, moderate npm audit findings are informational, Snyk and OSV are non-blocking, and container findings are reported without failing the build. The explicit dependency gate fails for known-malicious or critical advisories.

Review the workflow files and GitHub Actions results for current behavior. A successful run is not evidence that every scanner found zero issues.

## Local container commands

These package scripts require Docker and the named scanner tools to be installed:

    npm run build:docker
    npm run scan:trivy
    npm run scan:grype
    npm run sbom:generate

Report vulnerabilities using the process in [SECURITY.md](../SECURITY.md).
