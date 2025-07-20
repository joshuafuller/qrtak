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
