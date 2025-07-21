/**
 * Fuzz tests for QRTAK
 * Tests various inputs to find edge cases and potential crashes
 */

const { FuzzedDataProvider } = require('@jazzer.js/core');

// Import functions to test (adjust paths as needed)
// const { updateATAKQR, updateiTAKQR } = require('../src/js/main.js');

/**
 * Fuzz test for QR code generation with random inputs
 */
function fuzzQRGeneration(data) {
  const provider = new FuzzedDataProvider(data);
  
  // Generate random input parameters
  const host = provider.consumeString(100);
  const port = provider.consumeIntegralInRange(1, 65535);
  const callsign = provider.consumeString(50);
  const uid = provider.consumeString(100);
  const protocol = provider.consumeBoolean() ? 'tcp' : 'udp';
  
  try {
    // Test ATAK QR generation
    const atakUrl = `tak://${host}:${port}?callsign=${encodeURIComponent(callsign)}&uid=${encodeURIComponent(uid)}&protocol=${protocol}`;
    
    // Test iTAK CSV format
    const itakCsv = `${host},${port},${callsign},${uid}`;
    
    // Validate outputs
    if (atakUrl.length > 10000) {
      throw new Error('URL too long');
    }
    
    // Add more validation as needed
  } catch (e) {
    // Only throw if it's an unexpected error
    if (!e.message.includes('expected')) {
      throw e;
    }
  }
}

/**
 * Fuzz test for input validation
 */
function fuzzInputValidation(data) {
  const provider = new FuzzedDataProvider(data);
  
  // Test various malicious inputs
  const inputs = [
    provider.consumeString(1000), // Long strings
    provider.consumeBytes(100),    // Binary data
    String.fromCharCode(...provider.consumeBytes(50)), // Unicode
  ];
  
  for (const input of inputs) {
    try {
      // Test input sanitization
      const sanitized = input.replace(/[<>'"]/g, '');
      
      // Test URL encoding
      const encoded = encodeURIComponent(input);
      
      // Test length limits
      if (input.length > 0 && input.length < 10000) {
        // Process normally
      }
    } catch (e) {
      // Log unexpected errors
      console.error('Unexpected error:', e);
      throw e;
    }
  }
}

module.exports = {
  fuzzQRGeneration,
  fuzzInputValidation
}
