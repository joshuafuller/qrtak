# Workflow Consolidation Plan

## Current State (8 workflows)

- `deploy.yml` - Build, test, and deploy
- `docker-security-scan.yml` - Container security only
- `release-automation.yml` - Semantic release
- `release-docker-optimized.yml` - Docker multi-arch builds
- `release.yml` - Manual tag releases
- `scorecard.yml` - OSSF Scorecard
- `security-enhanced.yml` - Advanced security
- `security.yml` - Basic security

## Recommended State (5 workflows)

### 1. **security.yml** (Unified Security)

Combines: `security.yml` + `security-enhanced.yml` + `docker-security-scan.yml`

- All SAST, dependency, and container scanning
- Secret detection (once, not duplicated)
- SBOM generation (once)
- Fuzz testing
- Supply chain security checks

### 2. **deploy.yml** (Keep as-is)

- Clear CI/CD purpose
- Remove duplicate TruffleHog (now in security.yml)
- Focus on build, test, and deployment

### 3. **release.yml** (Unified Release)

Combines: `release.yml` + `release-automation.yml`

- Semantic release for all versioning
- Build and sign artifacts
- Create GitHub releases
- Trigger Docker builds

### 4. **release-docker.yml** (Rename from release-docker-optimized.yml)

- Keep separate for parallel multi-arch builds
- Triggered by release events
- Optimized for speed

### 5. **scorecard.yml** (Keep as-is)

- Specific OSSF integration
- Weekly security posture assessment

## Benefits

- **Reduced duplication**: From 8 to 5 workflows
- **Clearer purpose**: Each workflow has a single responsibility
- **Faster CI/CD**: Less redundant work
- **Easier maintenance**: Fewer files to update
- **Cost savings**: Fewer GitHub Actions minutes used

## Migration Steps

1. Create new unified `security.yml`
2. Test thoroughly
3. Update `deploy.yml` to remove duplicates
4. Create unified `release.yml`
5. Delete old workflows
6. Update documentation
