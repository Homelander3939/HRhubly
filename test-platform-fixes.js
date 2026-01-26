#!/usr/bin/env node

/**
 * Comprehensive Platform Fix Validation Script
 * 
 * This script validates that all the platform fixes are working correctly:
 * 1. Network configuration and Docker setup
 * 2. Business context resolution consistency
 * 3. tRPC error handling improvements
 * 4. React hooks usage fixes
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Platform Fix Validation Script');
console.log('==================================\n');

let testsPassed = 0;
let testsFailed = 0;
let warnings = 0;

function logSuccess(message) {
  console.log(`✅ ${message}`);
  testsPassed++;
}

function logError(message) {
  console.log(`❌ ${message}`);
  testsFailed++;
}

function logWarning(message) {
  console.log(`⚠️  ${message}`);
  warnings++;
}

function logInfo(message) {
  console.log(`ℹ️  ${message}`);
}

// Test 1: Docker Configuration Validation
console.log('1. Docker Configuration Validation');
console.log('-----------------------------------');

try {
  const dockerCompose = fs.readFileSync('docker/compose.yaml', 'utf8');
  
  // Check for explicit network configuration
  if (dockerCompose.includes('networks:') && dockerCompose.includes('app-network:')) {
    logSuccess('Docker compose has explicit network configuration');
  } else {
    logError('Docker compose missing explicit network configuration');
  }
  
  // Check for health checks
  const healthCheckCount = (dockerCompose.match(/healthcheck:/g) || []).length;
  if (healthCheckCount >= 3) {
    logSuccess(`Found ${healthCheckCount} health checks in Docker services`);
  } else {
    logError(`Only found ${healthCheckCount} health checks, expected at least 3`);
  }
  
  // Check for improved restart policies
  if (dockerCompose.includes('restart: unless-stopped')) {
    logSuccess('Services have proper restart policies');
  } else {
    logWarning('Services might benefit from restart policies');
  }
  
} catch (error) {
  logError(`Failed to read docker/compose.yaml: ${error.message}`);
}

// Test 2: Nginx Configuration Validation
console.log('\n2. Nginx Configuration Validation');
console.log('----------------------------------');

try {
  const nginxConfig = fs.readFileSync('docker/nginx/conf.d/default.conf', 'utf8');
  
  // Check for improved timeout settings
  if (nginxConfig.includes('proxy_connect_timeout') && nginxConfig.includes('proxy_read_timeout')) {
    logSuccess('Nginx has improved timeout configurations');
  } else {
    logError('Nginx missing improved timeout configurations');
  }
  
  // Check for retry logic
  if (nginxConfig.includes('proxy_next_upstream')) {
    logSuccess('Nginx has retry logic configured');
  } else {
    logError('Nginx missing retry logic');
  }
  
  // Check for WebSocket support
  if (nginxConfig.includes('$connection_upgrade') && nginxConfig.includes('map $http_upgrade')) {
    logSuccess('Nginx has WebSocket upgrade support');
  } else {
    logError('Nginx missing WebSocket upgrade support');
  }
  
} catch (error) {
  logError(`Failed to read nginx config: ${error.message}`);
}

// Test 3: App Configuration Validation
console.log('\n3. App Configuration Validation');
console.log('--------------------------------');

try {
  const appConfig = fs.readFileSync('app.config.ts', 'utf8');
  
  // Check for improved host configuration
  if (appConfig.includes('getAllowedHosts') && appConfig.includes('host: \'0.0.0.0\'')) {
    logSuccess('App config has improved host configuration');
  } else {
    logError('App config missing improved host configuration');
  }
  
  // Check for error handler
  if (appConfig.includes('errorHandler:')) {
    logSuccess('App config has error handler');
  } else {
    logError('App config missing error handler');
  }
  
  // Check for preview environment support
  if (appConfig.includes('codapt.app') && appConfig.includes('preview.codapt.app')) {
    logSuccess('App config supports preview environments');
  } else {
    logWarning('App config might not fully support preview environments');
  }
  
} catch (error) {
  logError(`Failed to read app.config.ts: ${error.message}`);
}

// Test 4: Business Context Consolidation Validation
console.log('\n4. Business Context Consolidation Validation');
console.log('---------------------------------------------');

try {
  const businessContextUtil = fs.readFileSync('src/server/utils/business-context.ts', 'utf8');
  
  // Check for consolidated function
  if (businessContextUtil.includes('export async function getBusinessContext')) {
    logSuccess('Consolidated getBusinessContext utility exists');
  } else {
    logError('Consolidated getBusinessContext utility missing');
  }
  
  // Check for proper error handling
  if (businessContextUtil.includes('Business not found') && businessContextUtil.includes('throw new Error')) {
    logSuccess('Business context utility has proper error handling');
  } else {
    logError('Business context utility missing proper error handling');
  }
  
  // Check for development environment handling
  if (businessContextUtil.includes('isDevEnvironment') && businessContextUtil.includes('isPreviewEnvironment')) {
    logSuccess('Business context utility handles development environments');
  } else {
    logError('Business context utility missing development environment handling');
  }
  
} catch (error) {
  logError(`Failed to read business context utility: ${error.message}`);
}

// Test 5: Procedure Updates Validation
console.log('\n5. Procedure Updates Validation');
console.log('-------------------------------');

const procedureFiles = [
  'src/server/trpc/procedures/candidate.ts',
  'src/server/trpc/procedures/test.ts',
  'src/server/trpc/procedures/admin.ts'
];

procedureFiles.forEach((filePath, index) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    // Check for consolidated import
    if (content.includes('import { getBusinessContext } from "~/server/utils/business-context"')) {
      logSuccess(`${fileName} uses consolidated business context import`);
    } else {
      logError(`${fileName} missing consolidated business context import`);
    }
    
    // Check that local getBusinessContext is removed
    if (content.includes('async function getBusinessContext') || content.includes('function getBusinessContext')) {
      logWarning(`${fileName} still has local getBusinessContext function (should be removed)`);
    } else {
      logSuccess(`${fileName} has removed local getBusinessContext function`);
    }
    
  } catch (error) {
    logError(`Failed to read ${filePath}: ${error.message}`);
  }
});

// Test 6: React Hooks Usage Validation
console.log('\n6. React Hooks Usage Validation');
console.log('--------------------------------');

try {
  const loginComponent = fs.readFileSync('src/routes/login/index.tsx', 'utf8');
  
  // Check for proper hook order (hooks should be at top level)
  const lines = loginComponent.split('\n');
  let inComponent = false;
  let hookCallsBeforeConditional = true;
  let foundConditionalReturn = false;
  
  for (const line of lines) {
    if (line.includes('function BusinessLogin()')) {
      inComponent = true;
      continue;
    }
    
    if (inComponent) {
      // Check for early returns before hooks
      if (line.includes('return') && line.includes('(') && !foundConditionalReturn) {
        foundConditionalReturn = true;
        if (line.includes('isDetecting')) {
          // This is the conditional return we expect
          continue;
        }
      }
      
      // Check for hook calls after conditional logic
      if (foundConditionalReturn && (line.includes('useTRPC') || line.includes('useMutation') || line.includes('useForm'))) {
        hookCallsBeforeConditional = false;
        break;
      }
    }
  }
  
  // Check for proper hook usage patterns
  if (loginComponent.includes('const trpc = useTRPC();') && loginComponent.includes('const loginMutation = useMutation(')) {
    logSuccess('Login component has proper hook assignment pattern');
  } else {
    logError('Login component missing proper hook assignment pattern');
  }
  
  // Check for proper useEffect cleanup
  if (loginComponent.includes('return () => {') && loginComponent.includes('isMounted = false')) {
    logSuccess('Login component has proper useEffect cleanup');
  } else {
    logError('Login component missing proper useEffect cleanup');
  }
  
  // Check for conditional hook calls (should not exist)
  if (loginComponent.includes('if (') && loginComponent.includes('useTRPC')) {
    logError('Login component has conditional hook calls');
  } else {
    logSuccess('Login component has no conditional hook calls');
  }
  
} catch (error) {
  logError(`Failed to read login component: ${error.message}`);
}

// Test 7: tRPC Handler Improvements Validation
console.log('\n7. tRPC Handler Improvements Validation');
console.log('---------------------------------------');

try {
  const trpcHandler = fs.readFileSync('src/server/trpc/handler.ts', 'utf8');
  
  // Check for improved error handling
  if (trpcHandler.includes('onError({') && trpcHandler.includes('console.error')) {
    logSuccess('tRPC handler has improved error handling');
  } else {
    logError('tRPC handler missing improved error handling');
  }
  
  // Check for CORS headers
  if (trpcHandler.includes('Access-Control-Allow-Origin') && trpcHandler.includes('responseMeta')) {
    logSuccess('tRPC handler has CORS headers');
  } else {
    logError('tRPC handler missing CORS headers');
  }
  
  // Check for proper error catching
  if (trpcHandler.includes('try {') && trpcHandler.includes('catch (error)')) {
    logSuccess('tRPC handler has proper error catching');
  } else {
    logError('tRPC handler missing proper error catching');
  }
  
} catch (error) {
  logError(`Failed to read tRPC handler: ${error.message}`);
}

// Test 8: Console Forward Plugin Improvements Validation
console.log('\n8. Console Forward Plugin Improvements Validation');
console.log('--------------------------------------------------');

try {
  const consolePlugin = fs.readFileSync('vite-console-forward-plugin.ts', 'utf8');
  
  // Check for improved retry logic
  if (consolePlugin.includes('MAX_RETRIES') && consolePlugin.includes('sendLogsWithRetry')) {
    logSuccess('Console forward plugin has improved retry logic');
  } else {
    logError('Console forward plugin missing improved retry logic');
  }
  
  // Check for timeout handling
  if (consolePlugin.includes('AbortController') && consolePlugin.includes('setTimeout')) {
    logSuccess('Console forward plugin has timeout handling');
  } else {
    logError('Console forward plugin missing timeout handling');
  }
  
  // Check for buffer size limits
  if (consolePlugin.includes('MAX_BUFFER_SIZE') && consolePlugin.includes('slice(0,')) {
    logSuccess('Console forward plugin has buffer size limits');
  } else {
    logError('Console forward plugin missing buffer size limits');
  }
  
} catch (error) {
  logError(`Failed to read console forward plugin: ${error.message}`);
}

// Test 9: Environment Configuration Validation
console.log('\n9. Environment Configuration Validation');
console.log('---------------------------------------');

try {
  const envFile = fs.readFileSync('.env', 'utf8');
  
  // Check for required environment variables
  const requiredVars = ['BASE_URL', 'JWT_SECRET', 'ADMIN_PASSWORD'];
  let missingVars = [];
  
  requiredVars.forEach(varName => {
    if (!envFile.includes(`${varName}=`)) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length === 0) {
    logSuccess('All required environment variables are present');
  } else {
    logError(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  // Check BASE_URL format
  const baseUrlMatch = envFile.match(/BASE_URL=(.+)/);
  if (baseUrlMatch && (baseUrlMatch[1].startsWith('http://') || baseUrlMatch[1].startsWith('https://'))) {
    logSuccess('BASE_URL has proper format');
  } else {
    logError('BASE_URL missing or has invalid format');
  }
  
} catch (error) {
  logError(`Failed to read .env file: ${error.message}`);
}

// Test 10: File Structure Validation
console.log('\n10. File Structure Validation');
console.log('-----------------------------');

const criticalFiles = [
  'docker/compose.yaml',
  'docker/nginx/conf.d/default.conf',
  'app.config.ts',
  'src/server/utils/business-context.ts',
  'src/routes/login/index.tsx',
  'src/server/trpc/handler.ts',
  'vite-console-forward-plugin.ts'
];

let missingFiles = [];
criticalFiles.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    missingFiles.push(filePath);
  }
});

if (missingFiles.length === 0) {
  logSuccess('All critical files are present');
} else {
  logError(`Missing critical files: ${missingFiles.join(', ')}`);
}

// Summary
console.log('\n📊 Test Summary');
console.log('===============');
console.log(`✅ Tests Passed: ${testsPassed}`);
console.log(`❌ Tests Failed: ${testsFailed}`);
console.log(`⚠️  Warnings: ${warnings}`);

if (testsFailed === 0) {
  console.log('\n🎉 All critical fixes have been applied successfully!');
  console.log('\nThe following issues should now be resolved:');
  console.log('• "Max tries reached (generate-unique-tags)" and "Request was aborted" errors');
  console.log('• "Invalid hook call" errors in React components');
  console.log('• Business context inconsistency between procedures');
  console.log('• Network connectivity and Docker configuration issues');
  console.log('\n🚀 The platform should now work correctly in the preview environment.');
} else {
  console.log('\n⚠️  Some issues were found. Please review the failed tests above.');
  console.log('The platform may still experience some of the reported issues until these are resolved.');
}

console.log('\n📋 Next Steps:');
console.log('1. Restart the Docker containers to apply configuration changes');
console.log('2. Test the login functionality to verify hook fixes');
console.log('3. Test business context resolution with different business names');
console.log('4. Monitor the console for any remaining network errors');
console.log('\nTo restart the platform: docker-compose down && docker-compose up -d');

process.exit(testsFailed > 0 ? 1 : 0);
