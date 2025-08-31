## [1.5.1](https://github.com/joshuafuller/qrtak/compare/v1.5.0...v1.5.1) (2025-08-31)


### Bug Fixes

* add preference JSON files to public directory for deployment ([80f3b8d](https://github.com/joshuafuller/qrtak/commit/80f3b8df1dbee846860d0918f5294dbe7f7709d8))
* remove OpenSSF Scorecard workflow and references ([#93](https://github.com/joshuafuller/qrtak/issues/93)) ([d20d6af](https://github.com/joshuafuller/qrtak/commit/d20d6af281d05c8214b804d0f898a24d81c2543c))
* sync package-lock.json version with package.json ([ad41874](https://github.com/joshuafuller/qrtak/commit/ad41874628cf9ad005744701e5c78cdb4aa4e11b))

## [1.5.3](https://github.com/joshuafuller/qrtak/compare/qrtak-v1.5.2...qrtak-v1.5.3) (2025-08-31)


### Bug Fixes

* handle both github-actions and github-actions[bot] in auto-merge workflow ([44fa9b8](https://github.com/joshuafuller/qrtak/commit/44fa9b8cc1c5d81005fc88656937225b2e39c397))
* update auto-merge workflow to use merge instead of squash ([bb5dfef](https://github.com/joshuafuller/qrtak/commit/bb5dfef13c83cf670a73ea56200895b45f98b772))

## [1.5.2](https://github.com/joshuafuller/qrtak/compare/qrtak-v1.5.1...qrtak-v1.5.2) (2025-08-31)


### Bug Fixes

* add workflow to sync package-lock.json in Release Please PRs ([d98258c](https://github.com/joshuafuller/qrtak/commit/d98258c60dd6c00cfe811eadc5d584cb6528b616))
* configure Release Please for automatic releases ([2b5b40f](https://github.com/joshuafuller/qrtak/commit/2b5b40f3d0c6a88b7164c093d1fce3db3ea6b068))
* ensure package-lock.json is properly updated by Release Please ([17bde6d](https://github.com/joshuafuller/qrtak/commit/17bde6d599df7ba0ffed2e0cdc472fdfff263449))
* standardize primary color usage for tabs and buttons ([#95](https://github.com/joshuafuller/qrtak/issues/95)) ([f7e87ec](https://github.com/joshuafuller/qrtak/commit/f7e87ec98b6bc57654467ebecf7c82fe95341e55))
* update Release Please fix workflow trigger ([5e6886b](https://github.com/joshuafuller/qrtak/commit/5e6886bbbf39005c7f590198cbf69003bc54c940))

## [1.5.0](https://github.com/joshuafuller/qrtak/compare/v1.4.12...v1.5.0) (2025-08-31)


### Features

* Unified TAK configuration with enhanced UX and comprehensive testing ([1f780a6](https://github.com/joshuafuller/qrtak/commit/1f780a645616d1b8c89c23b14f87c7206df06fd1))


### Bug Fixes

* correct version to 1.5.0 - we are still on v1.x ([8b32907](https://github.com/joshuafuller/qrtak/commit/8b32907c6a87b8c69c66dc56b09f77c88b00f78f))
* correct version to 3.2.0 after incorrect major bump ([391ced8](https://github.com/joshuafuller/qrtak/commit/391ced8c93fa96f89c887c99797f088e60e03c1c))
* reset version to 1.0.0 and add auto-merge for Release Please ([cf6cdc5](https://github.com/joshuafuller/qrtak/commit/cf6cdc5ad0c8c91e1b2b8f0e3a977e0ff0c0bb09))
* CI triggers and release workflow improvements ([a97bd58](https://github.com/joshuafuller/qrtak/commit/a97bd58cee8c6952c9ba0e33bfb9c3ff79e27573))
* remove ARMv7 from Docker builds ([aa67581](https://github.com/joshuafuller/qrtak/commit/aa675816b95356b89e9429e1a359455522c6589d))
* resolve profile loading issue with QR generation ([#79](https://github.com/joshuafuller/qrtak/issues/79)) ([b3e394b](https://github.com/joshuafuller/qrtak/commit/b3e394b3a09cb1c057af64028f0bd1729034a887)), closes [#45](https://github.com/joshuafuller/qrtak/issues/45)

## [1.4.12](https://github.com/joshuafuller/qrtak/compare/v1.4.11...v1.4.12) (2025-08-30)


### Bug Fixes

* correct GitHub Actions SHA references ([92db883](https://github.com/joshuafuller/qrtak/commit/92db883579a5c178abaa54e0c74f855fe25f4218))
* Dockerfile to reduce vulnerabilities ([b2d48d7](https://github.com/joshuafuller/qrtak/commit/b2d48d7fc3c7c7515f3fcd56713dd6494ca31b4a))
* regenerate clean package-lock.json ([58b6b3b](https://github.com/joshuafuller/qrtak/commit/58b6b3bf498e08371f3ac5b747cab176a738aec0))

## [1.4.11](https://github.com/joshuafuller/qrtak/compare/v1.4.10...v1.4.11) (2025-07-26)


### Features

* allow profiles to save all tabs ([#46](https://github.com/joshuafuller/qrtak/issues/46)) ([35d0ba2](https://github.com/joshuafuller/qrtak/commit/35d0ba278e5669c396d829470f126c73e950c316))

## [1.4.10](https://github.com/joshuafuller/qrtak/compare/v1.4.9...v1.4.10) (2025-07-26)


### Bug Fixes

* **ci:** move renovate config ([#38](https://github.com/joshuafuller/qrtak/issues/38)) ([e66d14d](https://github.com/joshuafuller/qrtak/commit/e66d14db027810074630545abe1b5afea17f0fa5))

## [1.4.9](https://github.com/joshuafuller/qrtak/compare/v1.4.8...v1.4.9) (2025-07-21)


### Bug Fixes

* **ci:** checkout before running renovate ([#35](https://github.com/joshuafuller/qrtak/issues/35)) ([4199f92](https://github.com/joshuafuller/qrtak/commit/4199f925daab8e8af910618a45ff791a3b5d26da))

## [1.4.8](https://github.com/joshuafuller/qrtak/compare/v1.4.7...v1.4.8) (2025-07-20)


### ⚠ BREAKING CHANGES

* Release process now uses Release Please instead of semantic-release
* Workflow structure has been reorganized
* Dockerfile structure changed significantly. Multi-platform builds now exclude arm/v7 (only amd64 and arm64).

### Features

* add automated versioning and release system ([7371894](https://github.com/joshuafuller/qrtak/commit/7371894e13a0f23dd666088c34eee4bf29f91523))
* add Babel and Jest configuration for testing and transpilation ([a68c690](https://github.com/joshuafuller/qrtak/commit/a68c690df0d07d0e532cd47dd33827403cfce847))
* add COMPLETE shield collection - ALL THE SHIELDS! ([aad91be](https://github.com/joshuafuller/qrtak/commit/aad91be516d7d726e9790f686184d325548fefe4))
* add comprehensive container security scanning with Trivy and Grype ([00e659a](https://github.com/joshuafuller/qrtak/commit/00e659a1a9b87d092a360b16464eedb26f9dd4ab))
* add comprehensive project shields ([88e5305](https://github.com/joshuafuller/qrtak/commit/88e53055eaa22697864c8e6f2cc387e3f8eac1e2))
* add comprehensive security documentation and badges ([7bd4d32](https://github.com/joshuafuller/qrtak/commit/7bd4d3226a530cf91d31e4e777ceb6e10a17cad3))
* add Docker package cleanup workflow and script ([98ae604](https://github.com/joshuafuller/qrtak/commit/98ae604ed96d915fabb06b925e2652a2eb97ccdc))
* add Docker version badge and improve help page layout ([4db6e72](https://github.com/joshuafuller/qrtak/commit/4db6e7223e31f441e9d0267b82f6c5e3ac550b86))
* Add GitHub icon and UI improvements ([fcf27c8](https://github.com/joshuafuller/qrtak/commit/fcf27c86d0d79f5f0d9fdb7cf8ab0ce52d522907))
* add initial fuzzing setup with build script and Dockerfile ([de9f2b5](https://github.com/joshuafuller/qrtak/commit/de9f2b5b6fc954b2103e5bfe0d57502cb74424d9))
* add security scan badges to README ([10cf720](https://github.com/joshuafuller/qrtak/commit/10cf7200fc45ffdb2fbdefd52307d4d29bf5dd75))
* consolidate workflows from 8 to 5 for better maintainability ([#25](https://github.com/joshuafuller/qrtak/issues/25)) ([ce28ea9](https://github.com/joshuafuller/qrtak/commit/ce28ea90a18312104e7c4957e4075ff8bd6a158f))
* enable OSSF Scorecard publishing and add badge ([d6f5ef1](https://github.com/joshuafuller/qrtak/commit/d6f5ef155abc7a0d996c69066dbdecaa94858d45))
* enable Snyk vulnerability scanning with configured token ([05d02c4](https://github.com/joshuafuller/qrtak/commit/05d02c4b8e3585abcd858cf67c733f5e3c754f66))
* enhance security workflows and add ANT testing support ([930461e](https://github.com/joshuafuller/qrtak/commit/930461e0030022b2c1b104644adf78a0d29e44c9))
* migrate from semantic-release to release-please ([#30](https://github.com/joshuafuller/qrtak/issues/30)) ([1e398fd](https://github.com/joshuafuller/qrtak/commit/1e398fd1dede48dd7d4e09fcdaee9e1b4ae5e770))
* re-enable multi-architecture Docker builds ([81d571b](https://github.com/joshuafuller/qrtak/commit/81d571b0629de3e79ffd465586b43714c3ac3741))


### Bug Fixes

* add debugging and error handling for Snyk authentication ([7ac0309](https://github.com/joshuafuller/qrtak/commit/7ac030906f3cd8f52f24c2c8acc043cf4d0ce7b2))
* add Docker image labels for package description ([419e299](https://github.com/joshuafuller/qrtak/commit/419e2994c2b0f17f1eb8cc5995a0eec2ec3dddbc))
* add release detection for Docker trigger ([#29](https://github.com/joshuafuller/qrtak/issues/29)) ([07d72bc](https://github.com/joshuafuller/qrtak/commit/07d72bc89dbcf6e35954b5b1cc4cc661d0292010))
* add version injection and multi-arch support to Docker builds ([156a1f8](https://github.com/joshuafuller/qrtak/commit/156a1f8c2c764efe2285831a17efda818d248e0d))
* address critical security findings from code scanning ([6ef649c](https://github.com/joshuafuller/qrtak/commit/6ef649cb276ac368144006851094c850f63245a9))
* address high priority security findings ([1fd8861](https://github.com/joshuafuller/qrtak/commit/1fd88611aa2f89dbcd7ad497095752df5a14cbf9))
* **ci:** prevent invalid Docker tags by using safe prefix for SHA ([ebc3ee6](https://github.com/joshuafuller/qrtak/commit/ebc3ee6fda63d237c4067c32495d447f51e7255d))
* correct GitHub Actions secret existence checks ([3ad9f96](https://github.com/joshuafuller/qrtak/commit/3ad9f9631048f80091d50feed0aceea6e810b965))
* create dedicated OSSF Scorecard workflow ([7c9b1e0](https://github.com/joshuafuller/qrtak/commit/7c9b1e0bde4f6626ab4086bf62329157bbb90d70))
* disable npm publishing for web application ([96aae2f](https://github.com/joshuafuller/qrtak/commit/96aae2f35cd1f696ef64e6cdc07cd0f4d4eacd8c))
* improve typosquatting detection and verify qrcode package ([cc56ce0](https://github.com/joshuafuller/qrtak/commit/cc56ce0b2755196a6c0152ad75998c99e4e93187))
* improve workflow names and fix permissions ([45125c9](https://github.com/joshuafuller/qrtak/commit/45125c9739b68461f6522beaaa3b92601b430779))
* make Snyk scan conditional on token availability ([1b173d9](https://github.com/joshuafuller/qrtak/commit/1b173d9a1995f16603829a27052d2f2a664a8ee0))
* only build Docker images in CI, don't push on every commit ([aa0c954](https://github.com/joshuafuller/qrtak/commit/aa0c954a8bc3ec82d1e62c0a87cfb4ae2653882d))
* only run Snyk steps if not Dependabot and not a PR from a fork ([8fed39e](https://github.com/joshuafuller/qrtak/commit/8fed39ea0a00fe0a3e25c19737568d20bf70f5f6))
* only run Snyk steps if SNYK_TOKEN secret is available ([815edb3](https://github.com/joshuafuller/qrtak/commit/815edb35fd6fdd8a9f76289411eae8df98a85887))
* package.json to reduce vulnerabilities ([cc59277](https://github.com/joshuafuller/qrtak/commit/cc59277e7da7cc0a063b579cce22917fa16c2727))
* regenerate package-lock.json to resolve Jest version mismatch ([b80a591](https://github.com/joshuafuller/qrtak/commit/b80a5919e49a6f3caea2c7b68946a2a62bd518b8))
* remove cosign signing to fix CI/CD failures ([0b99a5a](https://github.com/joshuafuller/qrtak/commit/0b99a5a8a23b8df9ae2f9eb341e000a595ee7940))
* remove invalid shell syntax from GitHub Actions conditional ([da3df48](https://github.com/joshuafuller/qrtak/commit/da3df484e337354a6455e4192542e13d633c9ea9))
* remove problematic optimized workflow ([96a4905](https://github.com/joshuafuller/qrtak/commit/96a490500fa1a7110739158bcf23f63ac6bcd41a))
* remove SHA-based tags from Docker releases ([d3bca44](https://github.com/joshuafuller/qrtak/commit/d3bca44e6f3faf7a18e28a6f296e981ac16c476f))
* replace broken Snyk vulnerability badge ([6cfa6b7](https://github.com/joshuafuller/qrtak/commit/6cfa6b74cd4d23ae6dd77fe185dc96a0c13b3ab8))
* replace non-working OSSF Scorecard badge with working alternatives ([24793d5](https://github.com/joshuafuller/qrtak/commit/24793d56c17190bc1fc8c64740d3c03f29e12dfb))
* replace OSV Scanner action with direct CLI usage ([2908eb9](https://github.com/joshuafuller/qrtak/commit/2908eb93684e75e7c7ab467342a901698e9be76e))
* resolve all ESLint no-unused-vars and no-console warnings ([aea32bc](https://github.com/joshuafuller/qrtak/commit/aea32bc418632ff690eb312ed86bce91a7be8977))
* resolve all workflow and Dockerfile issues ([8a6a701](https://github.com/joshuafuller/qrtak/commit/8a6a701755659f3b3f597cf765c28dcecb4aa770))
* resolve enhanced security workflow issues ([1048641](https://github.com/joshuafuller/qrtak/commit/1048641c8cb42a96034fb0b04f71204851b86fa0))
* resolve npm deprecation warnings with dependency overrides ([641a2ce](https://github.com/joshuafuller/qrtak/commit/641a2ce74eecec6e05233fd9ff209d03573fb643))
* resolve npm EACCES permission errors in security workflow ([6eb04a1](https://github.com/joshuafuller/qrtak/commit/6eb04a123f62b38ae82af99da30271ef093249ec))
* resolve npm permission errors and SARIF file path issues ([4cd59e8](https://github.com/joshuafuller/qrtak/commit/4cd59e8d7c53675e8b310ae4c67b9b3a53139348))
* resolve remaining enhanced security workflow failures ([5d9f614](https://github.com/joshuafuller/qrtak/commit/5d9f614048e5e6ef65bd56217412cc695764ba02))
* resolve Rollup native module issues for ARM builds ([642f4eb](https://github.com/joshuafuller/qrtak/commit/642f4eb0d0d5d8f1f1fd49aedc934947c2fc75d5))
* resolve security workflow errors - fix Semgrep params, TruffleHog/Trivy SARIF generation, and license check ([5fc27cd](https://github.com/joshuafuller/qrtak/commit/5fc27cd41b13255f42a49f695ec11448ab93d9da))
* resolve workflow failures and test issues ([79c6ca0](https://github.com/joshuafuller/qrtak/commit/79c6ca097a29b3ff439b58d35bf5652d1eed22d4))
* sanitize profile names before duplicate check ([2d75d0d](https://github.com/joshuafuller/qrtak/commit/2d75d0d86d0212084f15411a1cb59449816ec329))
* skip Docker push and Trivy scan on pull requests ([3131b50](https://github.com/joshuafuller/qrtak/commit/3131b50f19734691af71b1b64e6b0c74d84022d1))
* switch to tag-only releases to avoid branch protection conflicts ([#28](https://github.com/joshuafuller/qrtak/issues/28)) ([65ff7e9](https://github.com/joshuafuller/qrtak/commit/65ff7e99e4b0946bf7fec1d540396bb70c02e071))
* sync package-lock.json and remove duplicate CODEOWNERS ([7ba0593](https://github.com/joshuafuller/qrtak/commit/7ba0593406264f04cdc3fc8178a4d04c6ff477be))
* temporarily disable ARM64 builds to fix CI/CD failures ([990e160](https://github.com/joshuafuller/qrtak/commit/990e1600f84ad77c44ca886314f03f38bcfa01fa))
* update CII Best Practices badge and pin action versions ([84ffc3c](https://github.com/joshuafuller/qrtak/commit/84ffc3cdd4f31896f6625e711fad0de1ad9fb683))
* update Discord link in README ([87ac634](https://github.com/joshuafuller/qrtak/commit/87ac63424ed70d28c5ba40d4671729d8771c7298))
* update Node.js base image and improve Docker documentation ([4f0bb4f](https://github.com/joshuafuller/qrtak/commit/4f0bb4f172c8295ca84373e0ca15ec7ed7ec5a92))
* update OSV Scanner to latest version v2.0.2 ([7499ed4](https://github.com/joshuafuller/qrtak/commit/7499ed4f6738059cee942a573336d2159632d785))
* update OSV Scanner to working version v2.1.0 ([328a89a](https://github.com/joshuafuller/qrtak/commit/328a89a34c449012efd06bc978835baac8c3f399))
* update Trivy container scanning to use official action ([013564f](https://github.com/joshuafuller/qrtak/commit/013564f7278ec2c8b8672cffaad9824c9e41f57f))
* update TruffleHog secret scanning to use official action ([46f3af4](https://github.com/joshuafuller/qrtak/commit/46f3af40e33c6715fe31cac57fa7e57d906fb90a))
* use correct extra_args parameter for TruffleHog action ([e99b7fd](https://github.com/joshuafuller/qrtak/commit/e99b7fd29d0d204f4abc48aba34ac72f6058a41d))
* use correct Snyk badge URL format ([1348fab](https://github.com/joshuafuller/qrtak/commit/1348fab5ac23d5a8e5c5082f0f74baacf3e1c65d))
* use npm commands instead of npx in optimized workflow ([80bc072](https://github.com/joshuafuller/qrtak/commit/80bc072ff31c5b604a585c56c9b89b2a797d35f9))
* workflow failures after consolidation ([#26](https://github.com/joshuafuller/qrtak/issues/26)) ([f668da6](https://github.com/joshuafuller/qrtak/commit/f668da6bb7c5a60522db5734755b26ce87c830d0))


### Performance Improvements

* optimize Docker build performance with parallel architecture builds ([f3a39ce](https://github.com/joshuafuller/qrtak/commit/f3a39ce1b69c576de0fff168fb22ac1dc36e3eae))
* optimize Docker builds and CI/CD pipeline for speed ([aa7c986](https://github.com/joshuafuller/qrtak/commit/aa7c986e2c7bb71c995bff9df57bbda821861183))


### Documentation

* add Ask DeepWiki badge to README ([5b2ff6e](https://github.com/joshuafuller/qrtak/commit/5b2ff6e4664d39c81391f25565241117f6476287))
* simplify README by removing redundant badges ([6904011](https://github.com/joshuafuller/qrtak/commit/690401112ebf2d28a3e0f4a38089aed174e13dd0))
* update README and move DEPLOYMENT guide ([7df27cd](https://github.com/joshuafuller/qrtak/commit/7df27cde3eef16e0d7c81d4474445a96b1466c2d))
* update README to indicate work in progress status ([0976115](https://github.com/joshuafuller/qrtak/commit/0976115832e5a601ae01a2327eb24c75590341e9))


### Code Refactoring

* format service worker registration ([c90cf6a](https://github.com/joshuafuller/qrtak/commit/c90cf6a8a2fdc18b56e89d4c8b373dbf3c3d4312))
* **security:** remove unnecessary dependency on build for container scan job ([4079a91](https://github.com/joshuafuller/qrtak/commit/4079a91ab8af8d996baa47ab16799c3462f95407))
* simplify Snyk integration in security workflow ([ab241f9](https://github.com/joshuafuller/qrtak/commit/ab241f949dc6eaa78c8c575a52817a3c400f405e))
* streamline README layout and update shield presentation ([515b548](https://github.com/joshuafuller/qrtak/commit/515b5489575fbeef00c3e1cf0b4e515fff0580a5))

## [1.4.7](https://github.com/joshuafuller/qrtak/compare/v1.4.6...v1.4.7) (2025-07-20)


### Bug Fixes

* address high priority security findings ([1fd8861](https://github.com/joshuafuller/qrtak/commit/1fd88611aa2f89dbcd7ad497095752df5a14cbf9))

## [1.4.6](https://github.com/joshuafuller/qrtak/compare/v1.4.5...v1.4.6) (2025-07-20)


### Bug Fixes

* improve typosquatting detection and verify qrcode package ([cc56ce0](https://github.com/joshuafuller/qrtak/commit/cc56ce0b2755196a6c0152ad75998c99e4e93187))

## [1.4.5](https://github.com/joshuafuller/qrtak/compare/v1.4.4...v1.4.5) (2025-07-20)


### Bug Fixes

* address critical security findings from code scanning ([6ef649c](https://github.com/joshuafuller/qrtak/commit/6ef649cb276ac368144006851094c850f63245a9))

## [1.4.4](https://github.com/joshuafuller/qrtak/compare/v1.4.3...v1.4.4) (2025-07-20)


### Bug Fixes

* resolve npm EACCES permission errors in security workflow ([6eb04a1](https://github.com/joshuafuller/qrtak/commit/6eb04a123f62b38ae82af99da30271ef093249ec))

## [1.4.3](https://github.com/joshuafuller/qrtak/compare/v1.4.2...v1.4.3) (2025-07-20)


### Bug Fixes

* resolve workflow failures and test issues ([79c6ca0](https://github.com/joshuafuller/qrtak/commit/79c6ca097a29b3ff439b58d35bf5652d1eed22d4))

## [1.4.2](https://github.com/joshuafuller/qrtak/compare/v1.4.1...v1.4.2) (2025-07-20)


### Bug Fixes

* resolve npm deprecation warnings with dependency overrides ([641a2ce](https://github.com/joshuafuller/qrtak/commit/641a2ce74eecec6e05233fd9ff209d03573fb643))

## [1.4.1](https://github.com/joshuafuller/qrtak/compare/v1.4.0...v1.4.1) (2025-07-20)


### Bug Fixes

* resolve npm permission errors and SARIF file path issues ([4cd59e8](https://github.com/joshuafuller/qrtak/commit/4cd59e8d7c53675e8b310ae4c67b9b3a53139348))

## [1.4.0](https://github.com/joshuafuller/qrtak/compare/v1.3.2...v1.4.0) (2025-07-20)


### Features

* add comprehensive container security scanning with Trivy and Grype ([00e659a](https://github.com/joshuafuller/qrtak/commit/00e659a1a9b87d092a360b16464eedb26f9dd4ab))

## [1.3.2](https://github.com/joshuafuller/qrtak/compare/v1.3.1...v1.3.2) (2025-07-20)


### Bug Fixes

* sanitize profile names before duplicate check ([2d75d0d](https://github.com/joshuafuller/qrtak/commit/2d75d0d86d0212084f15411a1cb59449816ec329))

## [1.3.1](https://github.com/joshuafuller/qrtak/compare/v1.3.0...v1.3.1) (2025-07-20)


### Performance Improvements

* optimize Docker build performance with parallel architecture builds ([f3a39ce](https://github.com/joshuafuller/qrtak/commit/f3a39ce1b69c576de0fff168fb22ac1dc36e3eae))

## [1.3.0](https://github.com/joshuafuller/qrtak/compare/v1.2.4...v1.3.0) (2025-07-20)


### Features

* add Docker version badge and improve help page layout ([4db6e72](https://github.com/joshuafuller/qrtak/commit/4db6e7223e31f441e9d0267b82f6c5e3ac550b86))

## [1.2.4](https://github.com/joshuafuller/qrtak/compare/v1.2.3...v1.2.4) (2025-07-20)


### Bug Fixes

* sync package-lock.json and remove duplicate CODEOWNERS ([7ba0593](https://github.com/joshuafuller/qrtak/commit/7ba0593406264f04cdc3fc8178a4d04c6ff477be))

## [1.2.3](https://github.com/joshuafuller/qrtak/compare/v1.2.2...v1.2.3) (2025-07-20)


### Bug Fixes

* use correct Snyk badge URL format ([1348fab](https://github.com/joshuafuller/qrtak/commit/1348fab5ac23d5a8e5c5082f0f74baacf3e1c65d))

## [1.2.2](https://github.com/joshuafuller/qrtak/compare/v1.2.1...v1.2.2) (2025-07-20)


### Bug Fixes

* replace broken Snyk vulnerability badge ([6cfa6b7](https://github.com/joshuafuller/qrtak/commit/6cfa6b74cd4d23ae6dd77fe185dc96a0c13b3ab8))

## [1.2.1](https://github.com/joshuafuller/qrtak/compare/v1.2.0...v1.2.1) (2025-07-20)


### Bug Fixes

* add Docker image labels for package description ([419e299](https://github.com/joshuafuller/qrtak/commit/419e2994c2b0f17f1eb8cc5995a0eec2ec3dddbc))

## [1.2.0](https://github.com/joshuafuller/qrtak/compare/v1.1.1...v1.2.0) (2025-07-20)


### Features

* add Docker package cleanup workflow and script ([98ae604](https://github.com/joshuafuller/qrtak/commit/98ae604ed96d915fabb06b925e2652a2eb97ccdc))

## [1.1.1](https://github.com/joshuafuller/qrtak/compare/v1.1.0...v1.1.1) (2025-07-20)


### Bug Fixes

* resolve Rollup native module issues for ARM builds ([642f4eb](https://github.com/joshuafuller/qrtak/commit/642f4eb0d0d5d8f1f1fd49aedc934947c2fc75d5))

## [1.1.0](https://github.com/joshuafuller/qrtak/compare/v1.0.5...v1.1.0) (2025-07-20)


### Bug Fixes

* remove SHA-based tags from Docker releases ([d3bca44](https://github.com/joshuafuller/qrtak/commit/d3bca44e6f3faf7a18e28a6f296e981ac16c476f))


### Features

* re-enable multi-architecture Docker builds ([81d571b](https://github.com/joshuafuller/qrtak/commit/81d571b0629de3e79ffd465586b43714c3ac3741))

## [1.0.5](https://github.com/joshuafuller/qrtak/compare/v1.0.4...v1.0.5) (2025-07-20)


### Bug Fixes

* only build Docker images in CI, don't push on every commit ([aa0c954](https://github.com/joshuafuller/qrtak/commit/aa0c954a8bc3ec82d1e62c0a87cfb4ae2653882d))

## [1.0.4](https://github.com/joshuafuller/qrtak/compare/v1.0.3...v1.0.4) (2025-07-20)


### Bug Fixes

* remove problematic optimized workflow ([96a4905](https://github.com/joshuafuller/qrtak/commit/96a490500fa1a7110739158bcf23f63ac6bcd41a))

## [1.0.3](https://github.com/joshuafuller/qrtak/compare/v1.0.2...v1.0.3) (2025-07-20)


### Bug Fixes

* remove cosign signing to fix CI/CD failures ([0b99a5a](https://github.com/joshuafuller/qrtak/commit/0b99a5a8a23b8df9ae2f9eb341e000a595ee7940))

## [1.0.2](https://github.com/joshuafuller/qrtak/compare/v1.0.1...v1.0.2) (2025-07-20)


### Bug Fixes

* use npm commands instead of npx in optimized workflow ([80bc072](https://github.com/joshuafuller/qrtak/commit/80bc072ff31c5b604a585c56c9b89b2a797d35f9))

## [1.0.1](https://github.com/joshuafuller/qrtak/compare/v1.0.0...v1.0.1) (2025-07-20)


### Bug Fixes

* temporarily disable ARM64 builds to fix CI/CD failures ([990e160](https://github.com/joshuafuller/qrtak/commit/990e1600f84ad77c44ca886314f03f38bcfa01fa))

## [1.0.0](https://github.com/joshuafuller/qrtak/compare/v0.0.0...v1.0.0) (2025-07-20)


### Bug Fixes

* add version injection and multi-arch support to Docker builds ([156a1f8](https://github.com/joshuafuller/qrtak/commit/156a1f8c2c764efe2285831a17efda818d248e0d))
* disable npm publishing for web application ([96aae2f](https://github.com/joshuafuller/qrtak/commit/96aae2f35cd1f696ef64e6cdc07cd0f4d4eacd8c))
* update Node.js base image and improve Docker documentation ([4f0bb4f](https://github.com/joshuafuller/qrtak/commit/4f0bb4f172c8295ca84373e0ca15ec7ed7ec5a92))


### Performance Improvements

* optimize Docker builds and CI/CD pipeline for speed ([aa7c986](https://github.com/joshuafuller/qrtak/commit/aa7c986e2c7bb71c995bff9df57bbda821861183))


### BREAKING CHANGES

* Dockerfile structure changed significantly.
Multi-platform builds now exclude arm/v7 (only amd64 and arm64).
