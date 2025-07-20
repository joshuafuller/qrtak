#!/bin/bash
# Script to clean up old Docker package versions from GitHub Container Registry
# This will delete all untagged and SHA-based tags, keeping only semantic versions

echo "This script will delete old Docker package versions from ghcr.io"
echo "It will keep only semantic version tags (latest, v1.0.0, 1.0.0, etc.)"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    exit 1
fi

# Get all package versions
echo "Fetching package versions..."
VERSIONS=$(gh api \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "/user/packages/container/qrtak/versions" \
  --paginate \
  --jq '.[].id')

# Count versions
TOTAL=$(echo "$VERSIONS" | wc -l)
echo "Found $TOTAL versions"

# Get versions to keep (semantic versions only)
echo "Identifying semantic version tags to keep..."
KEEP_VERSIONS=$(gh api \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "/user/packages/container/qrtak/versions" \
  --paginate \
  --jq '.[] | select(.metadata.container.tags[] | test("^(latest|v?[0-9]+\\.[0-9]+\\.[0-9]+|[0-9]+\\.[0-9]+|[0-9]+)$")) | .id')

KEEP_COUNT=$(echo "$KEEP_VERSIONS" | grep -c .)
echo "Keeping $KEEP_COUNT semantic versions"

# Delete versions that are not in the keep list
DELETED=0
for VERSION_ID in $VERSIONS; do
  if ! echo "$KEEP_VERSIONS" | grep -q "^$VERSION_ID$"; then
    echo "Deleting version $VERSION_ID..."
    gh api \
      --method DELETE \
      -H "Accept: application/vnd.github+json" \
      -H "X-GitHub-Api-Version: 2022-11-28" \
      "/user/packages/container/qrtak/versions/$VERSION_ID"
    ((DELETED++))
  fi
done

echo ""
echo "Cleanup complete!"
echo "Deleted $DELETED versions"
echo "Kept $KEEP_COUNT semantic versions"