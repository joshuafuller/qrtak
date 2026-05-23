# Supply-Chain Defense

A layered defense against the ongoing wave of GitHub Actions / npm supply-chain
attacks. This is a living policy; it applies to this repo and is the template
for all `joshuafuller` repos.

## Threat landscape (why this exists)

As of May 2026 these are **active, near-daily** campaigns — not theory:

| Campaign | Date | Mechanism | What it steals |
|----------|------|-----------|----------------|
| tj-actions/changed-files | Mar 2025 | **Mutable action tag** repointed to malicious code | CI secrets |
| Shai-Hulud (1.0 / 2.0) | Sep / Nov 2025 | Self-replicating npm worm via **postinstall**; 2.0 wipes `$HOME` | npm/GitHub/cloud tokens |
| Mini Shai-Hulud (TanStack) | May 11 2026 | **Hijacked release pipeline mid-workflow**, abused OIDC to forge *valid SLSA provenance* | CI creds |
| node-ipc | May 14 2026 | Malicious versions of a 10M-downloads/wk lib | CI/cloud creds |
| @antv / echarts-for-react | May 2026 | **Maintainer account takeover** | CI/cloud creds |
| TeamPCP burst | May 19 2026 | 300+ malicious versions across 323 pkgs in 22 min | CI creds |
| **Megalodon** | May 18–22 2026 | **Compromised PAT/deploy key** pushes a malicious GHA workflow (base64 bash) straight to `main` | AWS/GCP/Azure creds, SSH keys, k8s/Docker config, Vault/Terraform tokens |

Two facts drive every control below:
1. **These waves are detected and yanked within hours-to-days** → *time* is the best filter.
2. **They execute via install scripts and exfiltrate over the network** → *blocking script execution and egress* neuters them.

## The layers

| # | Layer | Control | Defeats | Status |
|---|-------|---------|---------|--------|
| L1 | Dependency intake | **`minimumReleaseAge: 5 days`** + `internalChecksFilter: strict`; no un-aged auto-merge | Shai-Hulud, node-ipc, TeamPCP | ✅ shipped (PR #315) |
| L1 | Dependency intake | `npm ci --ignore-scripts` (+ allowlist for build-script pkgs via `@lavamoat/allow-scripts`) | worm `postinstall` | ⏳ planned (needs lavamoat — esbuild/vite need scripts) |
| L1 | Dependency intake | npm audit · OSV · Snyk · typosquatting check | known-vuln / typosquat | ✅ existing (`security.yml`) |
| L2 | CI/CD integrity | **All actions SHA-pinned** (immutable) | tj-actions, Megalodon tag hijack | ✅ shipped (PR #316) |
| L2 | CI/CD integrity | Renovate `helpers:pinGitHubActionDigests` (auto-maintain pins) | drift | ⏳ planned |
| L2 | CI/CD integrity | Least-privilege `permissions:` (read-only default) | token abuse | ◑ partial — `security.yml` scoped; audit the rest |
| L2 | CI/CD integrity | **`step-security/harden-runner`** egress policy (audit→block) | exfiltration to C2 (all worms) | ⏳ planned |
| L3 | Artifact integrity | SBOM + build provenance + cosign signing | tampering | ✅ existing |
| L3 | Artifact integrity | npm **trusted publishing (OIDC)** + verify tarball vs source | token theft; *but* TanStack forged provenance → pair with minimal release job | ⏳ planned |
| L4 | Container/runtime | **Base images pinned by digest** | tag repush | ✅ shipped (PR #317) |
| L4 | Container/runtime | Trivy + Grype image scan | image CVEs | ✅ shipped (PR #314 restored Trivy) |
| L5 | Identity/detection | Phishing-resistant MFA (passkeys) on GitHub + npm; expiring tokens; no long-lived PATs | account takeover (@antv), Megalodon stolen PAT | ☐ verify |
| L5 | Identity/detection | **OpenSSF Scorecard** + secret-scanning push protection + CodeQL | posture drift, leaked secrets | ✅ shipped (PR #318) |

> **Self-hosted runners (homelab ARC):** a worm on a self-hosted runner = RCE
> inside the cluster. Controls there: private-repos-only, ephemeral, no
> cluster service-account (done), + **egress NetworkPolicy** on runner pods to
> block reaching the k8s API / cloud metadata / lateral LAN targets (planned —
> needs the Harbor allowlist decision).

## Why provenance alone is not enough

The TanStack attack (May 11 2026) hijacked the *legitimate* release pipeline
and minted **valid SLSA provenance on malicious packages**. So "it has
provenance/signature" is necessary but **not sufficient**. Provenance must be
paired with: a minimal release workflow that runs **no untrusted code before
publish**, SHA-pinned actions, and tarball-vs-source verification.

## Incident response (if an IoC is found)

1. Rotate **all** tokens reachable from CI (npm, GitHub PAT, cloud, registry).
2. Revoke the offending PAT/deploy key; enable MFA.
3. Pin/roll back to the last-known-good dependency/action SHA.
4. Audit `git log` for unexpected direct-to-`main` commits and unknown authors.
5. Re-run the org-wide IoC sweep (see below).

### IoC sweep (run periodically + on any alert)

```bash
# Megalodon
gh search code 'Q0I9Imh0dHA6Ly8yMTYu' --owner=joshuafuller   # base64 payload sig
gh search code '216.126.225.129'      --owner=joshuafuller   # C2 IP
gh search commits 'author-email:build-system@noreply.dev' --owner=joshuafuller
# compromised npm packages in any package.json
for p in node-ipc tiledesk @antv echarts-for-react @ctrl/tinycolor; do
  gh search code "\"$p\"" --owner=joshuafuller --filename=package.json; done
```

Last sweep: **2026-05-23 — clean** across all repos.
