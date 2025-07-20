#!/bin/bash
# Script to rerun failed checks on Dependabot PRs

set -euo pipefail

echo "=== Dependabot PR Check Rerun Script ==="
echo "Finding Dependabot PRs with failed checks..."

# Get all Dependabot PRs
DEPENDABOT_PRS=$(gh pr list --author "app/dependabot" --json number,title,statusCheckRollup --limit 50)

# Process each PR
echo "$DEPENDABOT_PRS" | jq -r '.[] | @json' | while read -r pr_json; do
    PR_NUMBER=$(echo "$pr_json" | jq -r '.number')
    PR_TITLE=$(echo "$pr_json" | jq -r '.title')
    
    # Get failed checks
    FAILED_CHECKS=$(echo "$pr_json" | jq -r '[.statusCheckRollup[] | select(.conclusion == "FAILURE")] | length')
    
    if [ "$FAILED_CHECKS" -gt 0 ]; then
        echo ""
        echo "PR #$PR_NUMBER: $PR_TITLE"
        echo "Failed checks: $FAILED_CHECKS"
        
        # Get the workflow runs for this PR
        echo "Finding workflow runs to rerun..."
        
        # Find failed workflow runs for this PR
        # We need to get runs associated with the PR's head branch
        HEAD_BRANCH=$(echo "$pr_json" | jq -r '.statusCheckRollup[0].detailsUrl' | grep -oP 'runs/\K\d+' | head -1)
        
        # Get the workflow run ID from the failed check
        FAILED_RUN_IDS=$(echo "$pr_json" | jq -r '.statusCheckRollup[] | select(.conclusion == "FAILURE") | .detailsUrl' | grep -oP 'runs/\K\d+' | sort -u)
        
        if [ -n "$FAILED_RUN_IDS" ]; then
            echo "Found failed runs to rerun:"
            while IFS= read -r RUN_ID; do
                RUN_NAME=$(gh run view "$RUN_ID" --json name -q '.name')
                echo "  - Rerunning: $RUN_NAME (ID: $RUN_ID)"
                gh run rerun "$RUN_ID" --failed || echo "    Warning: Could not rerun $RUN_ID"
            done <<< "$FAILED_RUN_IDS"
        else
            echo "  No failed runs found to rerun"
        fi
    fi
done

echo ""
echo "=== Rerun complete ==="
echo "Check the Actions tab for updated status"