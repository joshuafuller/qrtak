## [1.3.2](https://github.com/joshuafuller/qrtak/compare/v1.3.1...v1.3.2) (2025-07-20)


### Bug Fixes

* sanitize profile names before duplicate check ([2d75d0d](https://github.com/joshuafuller/qrtak/commit/2d75d0d86d0212084f15411a1cb59449816ec329))

## [1.3.1](https://github.com/joshuafuller/qrtak/compare/v1.3.0...v1.3.1) (2025-07-20)


### Performance Improvements

* optimize Docker build performance with parallel architecture builds ([f3a39ce](https://github.com/joshuafuller/qrtak/commit/f3a39ce1b69c576de0fff168fb22ac1dc36e3eae))

# [1.3.0](https://github.com/joshuafuller/qrtak/compare/v1.2.4...v1.3.0) (2025-07-20)


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

# [1.2.0](https://github.com/joshuafuller/qrtak/compare/v1.1.1...v1.2.0) (2025-07-20)


### Features

* add Docker package cleanup workflow and script ([98ae604](https://github.com/joshuafuller/qrtak/commit/98ae604ed96d915fabb06b925e2652a2eb97ccdc))

## [1.1.1](https://github.com/joshuafuller/qrtak/compare/v1.1.0...v1.1.1) (2025-07-20)


### Bug Fixes

* resolve Rollup native module issues for ARM builds ([642f4eb](https://github.com/joshuafuller/qrtak/commit/642f4eb0d0d5d8f1f1fd49aedc934947c2fc75d5))

# [1.1.0](https://github.com/joshuafuller/qrtak/compare/v1.0.5...v1.1.0) (2025-07-20)


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

# [1.0.0](https://github.com/joshuafuller/qrtak/compare/v0.0.0...v1.0.0) (2025-07-20)


### Bug Fixes

* add version injection and multi-arch support to Docker builds ([156a1f8](https://github.com/joshuafuller/qrtak/commit/156a1f8c2c764efe2285831a17efda818d248e0d))
* disable npm publishing for web application ([96aae2f](https://github.com/joshuafuller/qrtak/commit/96aae2f35cd1f696ef64e6cdc07cd0f4d4eacd8c))
* update Node.js base image and improve Docker documentation ([4f0bb4f](https://github.com/joshuafuller/qrtak/commit/4f0bb4f172c8295ca84373e0ca15ec7ed7ec5a92))


### Performance Improvements

* optimize Docker builds and CI/CD pipeline for speed ([aa7c986](https://github.com/joshuafuller/qrtak/commit/aa7c986e2c7bb71c995bff9df57bbda821861183))


### BREAKING CHANGES

* Dockerfile structure changed significantly.
Multi-platform builds now exclude arm/v7 (only amd64 and arm64).
