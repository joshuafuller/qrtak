# Dependabot PR Management Scripts

This directory contains scripts to help manage Dependabot pull requests.

## Scripts Overview

### 1. `dependabot-status.sh`
Shows a comprehensive status report of all Dependabot PRs including:
- Check status (passed/failed/pending)
- Mergeable status
- Review requirements
- Summary statistics

**Usage:**
```bash
./scripts/dependabot-status.sh
```

### 2. `dependabot-rerun-checks.sh`
Reruns failed checks on Dependabot PRs. This is useful when checks fail due to transient issues.

**Usage:**
```bash
./scripts/dependabot-rerun-checks.sh
```

### 3. `dependabot-merge-passing.sh`
Automatically approves and merges Dependabot PRs that:
- Have all checks passing
- Are mergeable
- Are not drafts

**Usage:**
```bash
./scripts/dependabot-merge-passing.sh
```

### 4. `dependabot-recreate-prs.sh`
Closes and triggers recreation of Dependabot PRs with failed checks. This gives them a fresh start with new workflow runs.

**Usage:**
```bash
./scripts/dependabot-recreate-prs.sh
```

### 5. `dependabot-review.sh`
Reviews and approves Dependabot PRs that have all checks passing.

**Usage:**
```bash
./scripts/dependabot-review.sh
```

## Workflow Recommendations

1. **Start with status check:**
   ```bash
   ./scripts/dependabot-status.sh
   ```

2. **For PRs with transient failures:**
   ```bash
   ./scripts/dependabot-rerun-checks.sh
   ```

3. **For PRs that are ready to merge:**
   ```bash
   ./scripts/dependabot-merge-passing.sh
   ```

4. **For persistent failures (last resort):**
   ```bash
   ./scripts/dependabot-recreate-prs.sh
   ```

## About PR Reviews

If your repository requires PR reviews:
- The merge script will attempt to approve PRs before merging
- You may need to manually approve PRs if the script can't
- GitHub allows repository owners to merge even with pending review requirements in some cases

## Troubleshooting

- **"Not mergeable" status:** Wait a few moments and run the status script again. GitHub needs time to calculate mergeability.
- **Review required:** The merge script will try to approve, but you may need to manually review.
- **Persistent failures:** Check the specific failing check (often `sast-comprehensive`) for configuration issues.
- **Can't rerun workflows:** If workflows are too old or have restrictions, use the recreate script instead.

## Current Known Issues

The `sast-comprehensive` check is failing on some Dependabot PRs. This appears to be a configuration issue that may need to be addressed in the workflow file itself.