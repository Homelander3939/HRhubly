#!/usr/bin/env node

/**
 * Test script for robust business context resolution
 * This validates that the new robust business context system can handle edge cases
 * and provides better error handling than the original implementation
 */

import { db } from "../db";
import { getRobustBusinessContext } from "../utils/robust-business-context";

console.log('🧪 Robust Business Context Resolution Test');
console.log('==========================================\n');

async function runTests() {
  let testsPassed = 0;
  let testsFailed = 0;
  
  function logTest(name: string, passed: boolean, details?: string) {
    if (passed) {
      console.log(`✅ ${name}`);
      if (details) console.log(`   ${details}`);
      testsPassed++;
    } else {
      console.log(`❌ ${name}`);
      if (details) console.log(`   ${details}`);
      testsFailed++;
    }
  }

  // Test 1: Direct business ID resolution
  console.log('1. Testing Direct Business ID Resolution');
  console.log('----------------------------------------');
  
  try {
    // Get first business for testing
    const firstBusiness = await db.business.findFirst();
    if (!firstBusiness) {
      console.log('⚠️ No businesses found in database - creating test business');
      const testBusiness = await db.business.create({
        data: {
          name: 'test-company',
          displayName: 'Test Company',
          email: 'admin@test-company.com',
        },
      });
      logTest('Created test business for testing', true, `ID: ${testBusiness.id}`);
    }
    
    const business = firstBusiness || await db.business.findFirst();
    if (business) {
      const result = await getRobustBusinessContext(business.id);
      logTest('Direct business ID resolution', 
        result.businessId === business.id, 
        `Resolved to: ${result.business.name} (${result.businessId})`);
    } else {
      logTest('Direct business ID resolution', false, 'No business available for testing');
    }
  } catch (error) {
    logTest('Direct business ID resolution', false, `Error: ${error.message}`);
  }

  // Test 2: Business name resolution
  console.log('\n2. Testing Business Name Resolution');
  console.log('-----------------------------------');
  
  try {
    const business = await db.business.findFirst();
    if (business) {
      const result = await getRobustBusinessContext(undefined, undefined, undefined, business.name);
      logTest('Business name resolution', 
        result.businessId === business.id, 
        `Resolved "${business.name}" to ID: ${result.businessId}`);
      
      // Test case insensitive
      const upperResult = await getRobustBusinessContext(undefined, undefined, undefined, business.name.toUpperCase());
      logTest('Case insensitive business name resolution', 
        upperResult.businessId === business.id, 
        `Resolved "${business.name.toUpperCase()}" to ID: ${upperResult.businessId}`);
    } else {
      logTest('Business name resolution', false, 'No business available for testing');
    }
  } catch (error) {
    logTest('Business name resolution', false, `Error: ${error.message}`);
  }

  // Test 3: Hostname-based resolution (production scenario)
  console.log('\n3. Testing Hostname-based Resolution');
  console.log('------------------------------------');
  
  try {
    const business = await db.business.findFirst();
    if (business) {
      // Test subdomain pattern: businessname.hr.com
      const hostname = `${business.name}.hr.com`;
      const result = await getRobustBusinessContext(undefined, hostname);
      logTest('Subdomain hostname resolution', 
        result.businessId === business.id, 
        `Resolved "${hostname}" to: ${result.business.name} (${result.businessId})`);
      
      // Test that www subdomain is skipped
      const wwwHostname = `www.${business.name}.hr.com`;
      try {
        const wwwResult = await getRobustBusinessContext(undefined, wwwHostname);
        logTest('WWW subdomain handling', false, 'Should have failed but succeeded');
      } catch (error) {
        logTest('WWW subdomain handling', true, 'Correctly rejected www subdomain');
      }
    }
  } catch (error) {
    logTest('Hostname-based resolution', false, `Error: ${error.message}`);
  }

  // Test 4: Development environment fallback
  console.log('\n4. Testing Development Environment Fallback');
  console.log('-------------------------------------------');
  
  // Save original NODE_ENV
  const originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';
  
  try {
    // Test creating new business in development
    const newBusinessName = `test-business-${Date.now()}`;
    const result = await getRobustBusinessContext(
      undefined, 
      'localhost:3000', 
      undefined, 
      newBusinessName
    );
    
    logTest('Development environment business creation', 
      result.business.name === newBusinessName.toLowerCase(), 
      `Created business: ${result.business.name} (${result.businessId})`);
    
    // Clean up created business
    await db.business.delete({ where: { id: result.businessId } });
    logTest('Test business cleanup', true, `Deleted business ID: ${result.businessId}`);
    
  } catch (error) {
    logTest('Development environment fallback', false, `Error: ${error.message}`);
  } finally {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
  }

  // Test 5: Error handling for invalid inputs
  console.log('\n5. Testing Error Handling');
  console.log('-------------------------');
  
  try {
    // Test invalid business ID
    try {
      await getRobustBusinessContext(99999);
      logTest('Invalid business ID error handling', false, 'Should have thrown error');
    } catch (error) {
      logTest('Invalid business ID error handling', 
        error.message.includes('Business not found') || error.message.includes('Business context resolution failed'), 
        `Correctly threw error: ${error.message.substring(0, 100)}...`);
    }
    
    // Test nonexistent business name
    try {
      await getRobustBusinessContext(undefined, undefined, undefined, 'nonexistent-business-name');
      logTest('Nonexistent business name error handling', false, 'Should have thrown error');
    } catch (error) {
      logTest('Nonexistent business name error handling', 
        error.message.includes('not found') || error.message.includes('Business context resolution failed'), 
        `Correctly threw error: ${error.message.substring(0, 100)}...`);
    }
    
  } catch (error) {
    logTest('Error handling tests', false, `Unexpected error: ${error.message}`);
  }

  // Test 6: Comprehensive fallback logic
  console.log('\n6. Testing Comprehensive Fallback Logic');
  console.log('---------------------------------------');
  
  try {
    const business = await db.business.findFirst();
    if (business) {
      // Test with multiple parameters where some fail
      const result = await getRobustBusinessContext(
        99999, // Invalid business ID (should fail)
        'invalid-hostname', // Invalid hostname (should fail)
        undefined,
        business.name // Valid business name (should succeed)
      );
      
      logTest('Fallback to valid business name', 
        result.businessId === business.id, 
        `Fell back to business name resolution: ${result.business.name}`);
    }
  } catch (error) {
    logTest('Comprehensive fallback logic', false, `Error: ${error.message}`);
  }

  // Test 7: Referrer URL extraction
  console.log('\n7. Testing Referrer URL Extraction');
  console.log('----------------------------------');
  
  try {
    const business = await db.business.findFirst();
    if (business) {
      const referrerUrl = `https://example.com/${business.name}/some/path`;
      const result = await getRobustBusinessContext(undefined, undefined, referrerUrl);
      
      logTest('Referrer URL business extraction', 
        result.businessId === business.id, 
        `Extracted from referrer: ${referrerUrl} -> ${result.business.name}`);
    }
  } catch (error) {
    logTest('Referrer URL extraction', false, `Error: ${error.message}`);
  }

  // Test 8: Performance test
  console.log('\n8. Testing Performance');
  console.log('----------------------');
  
  try {
    const business = await db.business.findFirst();
    if (business) {
      const startTime = Date.now();
      const iterations = 10;
      
      for (let i = 0; i < iterations; i++) {
        await getRobustBusinessContext(business.id);
      }
      
      const endTime = Date.now();
      const averageTime = (endTime - startTime) / iterations;
      
      logTest('Performance test', 
        averageTime < 100, // Should be under 100ms on average
        `Average resolution time: ${averageTime.toFixed(2)}ms (${iterations} iterations)`);
    }
  } catch (error) {
    logTest('Performance test', false, `Error: ${error.message}`);
  }

  // Summary
  console.log('\n📊 Test Summary');
  console.log('===============');
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed! The robust business context resolution system is working correctly.');
    console.log('\nKey improvements validated:');
    console.log('• Comprehensive fallback logic');
    console.log('• Better error messages with debugging information');
    console.log('• Support for multiple resolution methods');
    console.log('• Development environment handling');
    console.log('• Performance optimization');
  } else {
    console.log('\n⚠️ Some tests failed. Please review the issues above before deploying.');
  }

  return testsFailed === 0;
}

// Run tests
runTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
  });
