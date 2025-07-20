# Versioning and Release Guide

## Overview

This project uses **Semantic Versioning** (SemVer) with automated releases via `semantic-release`.

## How It Works

### Automatic Version Bumping

Version numbers are automatically determined based on your commit messages:

| Commit Type | Version Bump | Example |
|------------|--------------|---------|
| `fix:` | Patch (1.0.0 → 1.0.1) | `fix: correct QR code generation bug` |
| `feat:` | Minor (1.0.0 → 1.1.0) | `feat: add support for HTTPS connections` |
| `BREAKING CHANGE:` | Major (1.0.0 → 2.0.0) | `feat!: change API format` |

### Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Examples:

```bash
# Bug fix (patch release)
git commit -m "fix: resolve QR code sizing issue on mobile"

# New feature (minor release)
git commit -m "feat: add dark mode support"

# Breaking change (major release)
git commit -m "feat!: migrate to new TAK protocol format

BREAKING CHANGE: QR codes now use v2 format, incompatible with older clients"
```

### Commit Types

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Code style changes (formatting, semicolons, etc)
- `refactor:` - Code refactoring without feature change
- `perf:` - Performance improvements
- `test:` - Adding or modifying tests
- `build:` - Build system changes
- `ci:` - CI/CD changes
- `chore:` - Other changes that don't modify src or test files

## Release Process

### Automatic Releases (Recommended)

1. Make your changes and commit with conventional commit messages
2. Push to a feature branch and create a PR
3. When PR is merged to `main`, semantic-release will:
   - Analyze commits since last release
   - Determine version bump needed
   - Update `package.json` version
   - Generate/update `CHANGELOG.md`
   - Create GitHub release with notes
   - Tag the release (e.g., `v1.2.3`)
   - Build and push Docker images with proper tags

### Manual Release (Emergency Only)

If automatic release fails:

```bash
# Ensure you're on main and up to date
git checkout main
git pull

# Run semantic-release manually
npm ci
npx semantic-release
```

## Docker Image Tags

Each release creates multiple Docker tags:

- `ghcr.io/joshuafuller/qrtak:latest` - Latest stable release
- `ghcr.io/joshuafuller/qrtak:v1.2.3` - Specific version
- `ghcr.io/joshuafuller/qrtak:1.2.3` - Version without 'v'
- `ghcr.io/joshuafuller/qrtak:1.2` - Minor version
- `ghcr.io/joshuafuller/qrtak:1` - Major version
- `ghcr.io/joshuafuller/qrtak:main-abc123f` - Commit-specific

## Pre-release Versions

For pre-releases, use branch names:

- `beta` branch → `v1.2.3-beta.1`
- `alpha` branch → `v1.2.3-alpha.1`

## Viewing Version Information

### In the Application
- Check `/version.json` endpoint
- View in browser console: `APP_VERSION`

### Docker Image
```bash
docker inspect ghcr.io/joshuafuller/qrtak:latest | grep -i version
```

### Git Tags
```bash
git tag -l
git describe --tags --abbrev=0  # Latest tag
```

## Troubleshooting

### Release Didn't Trigger
- Check commit messages follow conventional format
- Ensure PR was merged (not squashed) to preserve commit messages
- Check GitHub Actions logs for errors

### Wrong Version Bump
- Review commit messages since last release
- Breaking changes must include `BREAKING CHANGE:` in footer
- Use `feat!:` or `fix!:` for breaking changes

### NPM Publish Fails
- The package is not published to npm (private project)
- This is expected behavior; ignore npm publish errors

## Best Practices

1. **Write clear commit messages** - They become your release notes
2. **Use scopes** - `feat(security):` or `fix(docker):`
3. **Group related changes** - Makes changelog cleaner
4. **Test locally first** - Especially for major changes
5. **Document breaking changes** - Help users migrate

## Configuration

Release configuration is in `.releaserc.json`:
- Branches that trigger releases
- Plugins for changelog, git, GitHub releases
- Commit message formats

Docker build configuration uses:
- Multi-stage builds for security
- Version injection via build args
- OCI standard labels
- SBOM generation