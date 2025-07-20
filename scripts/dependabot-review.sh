#!/bin/bash
# Script to review and approve Dependabot PRs

set -euo pipefail

echo "=== Dependabot PR Review Script ==="
echo "This script will help you review and approve Dependabot PRs"
echo ""

# Get all Dependabot PRs
DEPENDABOT_PRS=$(gh pr list --author "app/dependabot" --json number,title,statusCheckRollup,mergeable,isDraft,reviewDecision --limit 50)

# Process each PR
echo "$DEPENDABOT_PRS" | jq -r '.[] | @json' | while read -r pr_json; do
    PR_NUMBER=$(echo "$pr_json" | jq -r '.number')
    PR_TITLE=$(echo "$pr_json" | jq -r '.title')
    REVIEW_DECISION=$(echo "$pr_json" | jq -r '.reviewDecision // "NONE"')
    
    # Get check status
    FAILED_CHECKS=$(echo "$pr_json" | jq -r '[.statusCheckRollup[] | select(.conclusion == "FAILURE")] | length')
    PENDING_CHECKS=$(echo "$pr_json" | jq -r '[.statusCheckRollup[] | select(.status != "COMPLETED")] | length')
    
    echo "PR #$PR_NUMBER: $PR_TITLE"
    echo "  Current review status: $REVIEW_DECISION"
    
    # Only approve if checks are passing and not already approved
    if [ "$FAILED_CHECKS" -eq 0 ] && [ "$PENDING_CHECKS" -eq 0 ]; then
        if [ "$REVIEW_DECISION" != "APPROVED" ]; then
            echo "  ✓ All checks passed - approving PR..."
            if gh pr review "$PR_NUMBER" --approve --body "Approved: All checks passed for this dependency update."; then
                echo "  ✓ Successfully approved!"
            else
                echo "  ✗ Could not approve (you may have already reviewed it)"
            fi
        else
            echo "  ℹ Already approved"
        fi
    else
        echo "  ⚠ Cannot approve - checks are failing or pending"
        echo "    Failed: $FAILED_CHECKS, Pending: $PENDING_CHECKS"
    fi
    echo ""
done

echo "=== Review Summary ==="
echo "To see which PRs still need review, run: ./scripts/dependabot-status.sh"
echo "To merge approved PRs, run: ./scripts/dependabot-merge-passing.sh"