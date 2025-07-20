#!/bin/bash
# Script to show comprehensive status of all Dependabot PRs

set -euo pipefail

echo "=== Dependabot PR Status Report ==="
echo "Generated at: $(date)"
echo ""

# Get all Dependabot PRs
DEPENDABOT_PRS=$(gh pr list --author "app/dependabot" --json number,title,statusCheckRollup,mergeable,isDraft,reviewDecision,reviews --limit 50)

# Counters
TOTAL_PRS=0
PASSING_PRS=0
FAILING_PRS=0
MERGEABLE_PRS=0
NEEDS_REVIEW=0

# Process each PR
while read -r pr_json; do
    PR_NUMBER=$(echo "$pr_json" | jq -r '.number')
    PR_TITLE=$(echo "$pr_json" | jq -r '.title')
    MERGEABLE=$(echo "$pr_json" | jq -r '.mergeable')
    IS_DRAFT=$(echo "$pr_json" | jq -r '.isDraft')
    REVIEW_DECISION=$(echo "$pr_json" | jq -r '.reviewDecision // "NONE"')
    
    # Get check counts
    FAILED_CHECKS=$(echo "$pr_json" | jq -r '[.statusCheckRollup[] | select(.conclusion == "FAILURE")] | length')
    PENDING_CHECKS=$(echo "$pr_json" | jq -r '[.statusCheckRollup[] | select(.status != "COMPLETED")] | length')
    TOTAL_CHECKS=$(echo "$pr_json" | jq -r '.statusCheckRollup | length')
    
    # Get review status
    APPROVED_REVIEWS=$(echo "$pr_json" | jq -r '[.reviews[] | select(.state == "APPROVED")] | length')
    CHANGES_REQUESTED=$(echo "$pr_json" | jq -r '[.reviews[] | select(.state == "CHANGES_REQUESTED")] | length')
    
    ((TOTAL_PRS++)) || true
    
    echo "PR #$PR_NUMBER: ${PR_TITLE:0:60}..."
    echo "  Checks: $((TOTAL_CHECKS - FAILED_CHECKS - PENDING_CHECKS))/$TOTAL_CHECKS passed"
    
    if [ "$FAILED_CHECKS" -gt 0 ]; then
        echo "  ✗ Failed checks:"
        echo "$pr_json" | jq -r '.statusCheckRollup[] | select(.conclusion == "FAILURE") | "    - \(.name)"'
        ((FAILING_PRS++)) || true
    fi
    
    if [ "$PENDING_CHECKS" -gt 0 ]; then
        echo "  ⏳ Pending checks: $PENDING_CHECKS"
    fi
    
    if [ "$FAILED_CHECKS" -eq 0 ] && [ "$PENDING_CHECKS" -eq 0 ]; then
        echo "  ✓ All checks passed"
        ((PASSING_PRS++)) || true
    fi
    
    echo "  Mergeable: $MERGEABLE"
    echo "  Review status: $REVIEW_DECISION (Approved: $APPROVED_REVIEWS, Changes requested: $CHANGES_REQUESTED)"
    
    if [ "$MERGEABLE" = "MERGEABLE" ]; then
        ((MERGEABLE_PRS++)) || true
    fi
    
    if [ "$REVIEW_DECISION" = "NONE" ] || [ "$REVIEW_DECISION" = "REVIEW_REQUIRED" ]; then
        ((NEEDS_REVIEW++)) || true
    fi
    
    echo ""
done < <(echo "$DEPENDABOT_PRS" | jq -r '.[] | @json')

echo "=== Summary ==="
echo "Total Dependabot PRs: $TOTAL_PRS"
echo "All checks passing: $PASSING_PRS"
echo "With failed checks: $FAILING_PRS"
echo "Mergeable: $MERGEABLE_PRS"
echo "Needs review: $NEEDS_REVIEW"
echo ""

# Quick actions
echo "=== Quick Actions ==="
echo "1. Rerun failed checks:    ./scripts/dependabot-rerun-checks.sh"
echo "2. Merge passing PRs:      ./scripts/dependabot-merge-passing.sh"
echo "3. Recreate failed PRs:    ./scripts/dependabot-recreate-prs.sh"
echo "4. Check status:           ./scripts/dependabot-status.sh"