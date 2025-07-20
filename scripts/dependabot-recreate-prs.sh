#!/bin/bash
# Script to close and recreate Dependabot PRs to get fresh runs

set -euo pipefail

echo "=== Dependabot PR Recreation Script ==="
echo "WARNING: This will close and recreate PRs, triggering new workflow runs"
echo ""

# Confirmation prompt
read -p "Are you sure you want to close and recreate Dependabot PRs? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Operation cancelled"
    exit 0
fi

# Get all Dependabot PRs with failed checks
DEPENDABOT_PRS=$(gh pr list --author "app/dependabot" --json number,title,statusCheckRollup,headRefName --limit 50)

# Process each PR
echo "$DEPENDABOT_PRS" | jq -r '.[] | @json' | while read -r pr_json; do
    PR_NUMBER=$(echo "$pr_json" | jq -r '.number')
    PR_TITLE=$(echo "$pr_json" | jq -r '.title')
    BRANCH_NAME=$(echo "$pr_json" | jq -r '.headRefName')
    
    # Get failed checks
    FAILED_CHECKS=$(echo "$pr_json" | jq -r '[.statusCheckRollup[] | select(.conclusion == "FAILURE")] | length')
    
    if [ "$FAILED_CHECKS" -gt 0 ]; then
        echo ""
        echo "PR #$PR_NUMBER: $PR_TITLE"
        echo "Branch: $BRANCH_NAME"
        echo "Failed checks: $FAILED_CHECKS"
        
        # Close the PR with a comment
        echo "  - Adding comment and closing PR..."
        gh pr comment "$PR_NUMBER" --body "Closing and recreating this PR to trigger fresh workflow runs due to failed checks."
        gh pr close "$PR_NUMBER"
        
        # Wait a moment
        sleep 2
        
        # Trigger Dependabot to recreate by using the recreate command
        echo "  - Triggering Dependabot to recreate..."
        gh pr comment "$PR_NUMBER" --body "@dependabot recreate"
        
        echo "  - Done. Dependabot should recreate this PR shortly."
    fi
done

echo ""
echo "=== Recreation process complete ==="
echo "Dependabot will recreate the closed PRs automatically."
echo "Check back in a few minutes for the new PRs."