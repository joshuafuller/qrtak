# Releases

qrtak uses [Release Please](https://github.com/googleapis/release-please) with the configuration in release-please-config.json.

## Release flow

1. Merge changes to main using Conventional Commit messages.
2. The Release Please workflow opens or updates a release pull request and updates version metadata and the changelog.
3. Merging that pull request creates a GitHub release.
4. The Docker Release workflow publishes multi-architecture images when the release is published.

Use feat for features, fix for bug fixes, and BREAKING CHANGE in the commit footer for breaking changes. Release Please determines the version bump from these commits.

## Container tags

A release publishes the latest tag and semantic-version tags for the released version, minor version, and major version. The workflow also publishes a v-prefixed full version tag.

The release workflow uploads a distribution archive and build provenance. The Docker workflow uploads an SBOM.

See [Release Please](../.github/workflows/release-please.yml), [Docker Release](../.github/workflows/release-docker.yml), and [release-please-config.json](../release-please-config.json) for the live configuration.
