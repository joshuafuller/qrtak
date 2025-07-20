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
