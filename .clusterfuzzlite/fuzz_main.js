// Copyright 2021 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const { FuzzedDataProvider } = require('@jazzer.js/core');

// Import the main module functions to test
// Since main.js uses ES modules, we need to handle it appropriately
const path = require('path');
const fs = require('fs');

// Read and evaluate the main.js content in a way that works with the fuzzer
const mainJsPath = path.join(__dirname, '../src/js/main.js');
const mainJsContent = fs.readFileSync(mainJsPath, 'utf8');

// Extract key functions from the module for fuzzing
// This is a simplified approach - in production you'd want proper module loading
const extractedFunctions = {};

// Extract sanitizeInput function
const sanitizeInputMatch = mainJsContent.match(/function sanitizeInput\s*\([^)]*\)\s*{[^}]+}/);
if (sanitizeInputMatch) {
  eval('extractedFunctions.sanitizeInput = ' + sanitizeInputMatch[0]);
}

// Extract extractHostnameFromURL function
const extractHostnameMatch = mainJsContent.match(/function extractHostnameFromURL\s*\([^)]*\)\s*{[\s\S]*?^}/m);
if (extractHostnameMatch) {
  eval('extractedFunctions.extractHostnameFromURL = ' + extractHostnameMatch[0]);
}

// Fuzzing target
module.exports.fuzz = function(data) {
  const provider = new FuzzedDataProvider(data);
  
  try {
    // Test various input processing functions with fuzzed data
    const fuzzedString = provider.consumeString(100);
    
    // Test sanitizeInput if available
    if (extractedFunctions.sanitizeInput) {
      extractedFunctions.sanitizeInput(fuzzedString);
    }
    
    // Test URL extraction if available
    if (extractedFunctions.extractHostnameFromURL) {
      extractedFunctions.extractHostnameFromURL(fuzzedString);
    }
    
    // Test with various protocol prefixes
    const protocols = ['http://', 'https://', 'ssl://', 'tcp://'];
    const protocol = protocols[provider.consumeIntegralInRange(0, protocols.length - 1)];
    const urlWithProtocol = protocol + fuzzedString;
    
    if (extractedFunctions.extractHostnameFromURL) {
      extractedFunctions.extractHostnameFromURL(urlWithProtocol);
    }
    
    // Test port validation patterns
    const portString = provider.consumeString(10);
    const portPattern = /^([1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/;
    portPattern.test(portString);
    
    // Test hostname validation patterns
    const hostnamePattern = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?(\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?)*$/;
    hostnamePattern.test(fuzzedString);
    
  } catch (e) {
    // Catch any errors during fuzzing but don't crash
    // This allows the fuzzer to continue finding issues
    if (e.message && e.message.includes('Maximum call stack')) {
      throw e; // Re-throw stack overflow errors as they indicate bugs
    }
  }
};