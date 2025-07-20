#!/bin/bash
# Script to merge Dependabot PRs that are passing all checks

set -euo pipefail

echo "=== Dependabot PR Auto-Merge Script ==="
echo "Finding Dependabot PRs that are ready to merge..."

# Get all Dependabot PRs
DEPENDABOT_PRS=$(gh pr list --author "app/dependabot" --json number,title,statusCheckRollup,mergeable,isDraft --limit 50)

# Track what we find
MERGEABLE_COUNT=0
MERGED_COUNT=0

# Process each PR
echo "$DEPENDABOT_PRS" | jq -r '.[] | @json' | while read -r pr_json; do
    PR_NUMBER=$(echo "$pr_json" | jq -r '.number')
    PR_TITLE=$(echo "$pr_json" | jq -r '.title')
    MERGEABLE=$(echo "$pr_json" | jq -r '.mergeable')
    IS_DRAFT=$(echo "$pr_json" | jq -r '.isDraft')
    
    # Get failed checks count
    FAILED_CHECKS=$(echo "$pr_json" | jq -r '[.statusCheckRollup[] | select(.conclusion == "FAILURE")] | length')
    
    # Get pending checks count
    PENDING_CHECKS=$(echo "$pr_json" | jq -r '[.statusCheckRollup[] | select(.status != "COMPLETED")] | length')
    
    # Check if all checks passed
    if [ "$FAILED_CHECKS" -eq 0 ] && [ "$PENDING_CHECKS" -eq 0 ] && [ "$IS_DRAFT" = "false" ]; then
        echo ""
        echo "PR #$PR_NUMBER: $PR_TITLE"
        echo "  Status: All checks passed"
        echo "  Mergeable: $MERGEABLE"
        
        ((MERGEABLE_COUNT++)) || true
        
        if [ "$MERGEABLE" = "MERGEABLE" ]; then
            # Try to approve the PR first (in case review is required)
            echo "  - Approving PR..."
            gh pr review "$PR_NUMBER" --approve --body "Auto-approved: All checks passed" || echo "    Note: Could not approve (may already be approved)"
            
            # Try to merge
            echo "  - Attempting to merge..."
            if gh pr merge "$PR_NUMBER" --merge --body "Auto-merged by script: All checks passed"; then
                echo "  ✓ Successfully merged!"
                ((MERGED_COUNT++)) || true
            else
                echo "  ✗ Could not merge (may require manual review or have conflicts)"
            fi
        else
            echo "  ✗ Not mergeable (status: $MERGEABLE)"
        fi
    fi
done

echo ""
echo "=== Summary ==="
echo "Found $MERGEABLE_COUNT PRs with all checks passing"
echo "Successfully merged $MERGED_COUNT PRs"

# Show current status
echo ""
echo "=== Current Dependabot PR Status ==="
gh pr list --author "app/dependabot" --json number,title,statusCheckRollup,mergeable | jq -r '.[] | "PR #\(.number): \(.title)\n  Mergeable: \(.mergeable)\n  Failed checks: \([.statusCheckRollup[] | select(.conclusion == "FAILURE")] | length)"'