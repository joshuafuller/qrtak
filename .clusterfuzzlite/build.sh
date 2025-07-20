#!/bin/bash -eu
# Copyright 2021 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Build the project
npm run build || true

# Create fuzz target directory
mkdir -p $OUT

# Copy the fuzz target
cp .clusterfuzzlite/fuzz_main.js $OUT/fuzz_main.js

# Generate seed corpus from test data if available
if [ -d "src/js/__tests__" ]; then
  zip -r $OUT/fuzz_main_seed_corpus.zip src/js/__tests__/ || true
fi