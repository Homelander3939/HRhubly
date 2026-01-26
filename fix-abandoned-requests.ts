#!/usr/bin/env node

/**
 * Script to diagnose and fix "request was abandoned" issues
 * This tests network connectivity, timeout settings, and server configuration
 */

import { db } from "../db";
import fs from 'fs';
import path from 'path';

console.log('🔧 Request Abandonment Diagnosis and Fix Script');
console.log('==============================================\n');

async function runDiagnostics() {
  let issuesFound = 0;
  let fixesApplied = 0;
  
  function logIssue(category: string, issue: string, severity: 'high' | 'medium' | 'low' = 'medium') {
    const icon = severity === 'high' ? '🚨' : severity === 'medium' ? '⚠️' : 'ℹ️';
    console.log(`${icon} [${category}] ${issue}`);
    issuesFound++;
  }
  
  function logFix(category: string, fix: string) {
    console.log(`✅ [${category}] ${fix}`);
    fixesApplied++;
  }
  
  function logInfo(category: string, info: string) {
    console.log(`📋 [${category}] ${info}`);
  }

  // 1. Test Database Connectivity
  console.log('1. Testing Database Connectivity');
  console.log('--------------------------------');
  
  try {
    const startTime = Date.now();
    await db.$queryRaw`SELECT 1 as test`;
    const duration = Date.now() - startTime;
    
    if (duration > 1000) {
      logIssue('Database', `Slow database response: ${duration}ms (should be < 1000ms)`, 'medium');
    } else {
      logInfo('Database', `Database connection healthy: ${duration}ms`);
    }
  } catch (error) {
    logIssue('Database', `Database connection failed: ${(error as Error).message}`, 'high');
  }

  // 2. Check Docker Configuration
  console.log('\n2. Checking Docker Configuration');
  console.log('--------------------------------');
  
  try {
    const dockerComposePath = path.join(process.cwd(), 'docker', 'compose.yaml');
    if (fs.existsSync(dockerComposePath)) {
      const dockerCompose = fs.readFileSync(dockerComposePath, 'utf8');
      
      // Check for health checks
      const healthCheckCount = (dockerCompose.match(/healthcheck:/g) || []).length;
      if (healthCheckCount < 3) {
        logIssue('Docker', `Insufficient health checks: ${healthCheckCount} (recommended: 3+)`, 'medium');
      } else {
        logInfo('Docker', `Health checks configured: ${healthCheckCount}`);
      }
      
      // Check for restart policies
      if (!dockerCompose.includes('restart:')) {
        logIssue('Docker', 'No restart policies configured', 'medium');
      } else {
        logInfo('Docker', 'Restart policies found');
      }
      
      // Check for explicit networks
      if (!dockerCompose.includes('networks:')) {
        logIssue('Docker', 'No explicit network configuration', 'low');
      } else {
        logInfo('Docker', 'Network configuration found');
      }
      
    } else {
      logIssue('Docker', 'Docker compose file not found', 'high');
    }
  } catch (error) {
    logIssue('Docker', `Error reading docker configuration: ${(error as Error).message}`, 'medium');
  }

  // 3. Check Nginx Configuration
  console.log('\n3. Checking Nginx Configuration');
  console.log('-------------------------------');
  
  try {
    const nginxConfigPath = path.join(process.cwd(), 'docker', 'nginx', 'conf.d', 'default.conf');
    if (fs.existsSync(nginxConfigPath)) {
      const nginxConfig = fs.readFileSync(nginxConfigPath, 'utf8');
      
      // Check timeout settings
      const timeoutSettings = [
        'proxy_connect_timeout',
        'proxy_send_timeout', 
        'proxy_read_timeout'
      ];
      
      for (const setting of timeoutSettings) {
        if (!nginxConfig.includes(setting)) {
          logIssue('Nginx', `Missing timeout setting: ${setting}`, 'medium');
        } else {
          // Extract timeout value
          const match = nginxConfig.match(new RegExp(`${setting}\\s+(\\d+)`));
          if (match) {
            const timeout = parseInt(match[1]);
            if (timeout < 30) {
              logIssue('Nginx', `Low timeout for ${setting}: ${timeout}s (recommended: 30s+)`, 'medium');
            } else {
              logInfo('Nginx', `${setting}: ${timeout}s`);
            }
          }
        }
      }
      
      // Check retry logic
      if (!nginxConfig.includes('proxy_next_upstream')) {
        logIssue('Nginx', 'No retry logic configured', 'medium');
      } else {
        logInfo('Nginx', 'Retry logic configured');
      }
      
      // Check WebSocket support
      if (!nginxConfig.includes('$connection_upgrade')) {
        logIssue('Nginx', 'WebSocket upgrade not configured', 'low');
      } else {
        logInfo('Nginx', 'WebSocket upgrade support found');
      }
      
    } else {
      logIssue('Nginx', 'Nginx configuration file not found', 'high');
    }
  } catch (error) {
    logIssue('Nginx', `Error reading nginx configuration: ${(error as Error).message}`, 'medium');
  }

  // 4. Test tRPC Handler Performance
  console.log('\n4. Testing tRPC Handler Performance');
  console.log('-----------------------------------');
  
  try {
    // Test database query performance
    const iterations = 5;
    let totalTime = 0;
    
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      await db.business.findFirst();
      totalTime += Date.now() - startTime;
    }
    
    const averageTime = totalTime / iterations;
    
    if (averageTime > 500) {
      logIssue('Performance', `Slow database queries: ${averageTime.toFixed(2)}ms average`, 'medium');
    } else {
      logInfo('Performance', `Database query performance: ${averageTime.toFixed(2)}ms average`);
    }
    
  } catch (error) {
    logIssue('Performance', `Error testing performance: ${(error as Error).message}`, 'medium');
  }

  // 5. Check Environment Configuration
  console.log('\n5. Checking Environment Configuration');
  console.log('------------------------------------');
  
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      
      // Check for required environment variables
      const requiredVars = ['BASE_URL', 'DATABASE_URL', 'JWT_SECRET'];
      for (const varName of requiredVars) {
        if (!envContent.includes(`${varName}=`)) {
          logIssue('Environment', `Missing required variable: ${varName}`, 'high');
        } else {
          logInfo('Environment', `${varName} configured`);
        }
      }
      
      // Check BASE_URL format
      const baseUrlMatch = envContent.match(/BASE_URL=(.+)/);
      if (baseUrlMatch) {
        const baseUrl = baseUrlMatch[1].trim();
        if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
          logIssue('Environment', `Invalid BASE_URL format: ${baseUrl}`, 'medium');
        } else {
          logInfo('Environment', `BASE_URL format valid: ${baseUrl}`);
        }
      }
      
    } else {
      logIssue('Environment', '.env file not found', 'high');
    }
  } catch (error) {
    logIssue('Environment', `Error reading .env file: ${(error as Error).message}`, 'medium');
  }

  // 6. Test Memory and Resource Usage
  console.log('\n6. Checking Resource Usage');
  console.log('--------------------------');
  
  try {
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
    };
    
    logInfo('Memory', `RSS: ${memUsageMB.rss}MB, Heap: ${memUsageMB.heapUsed}/${memUsageMB.heapTotal}MB`);
    
    if (memUsageMB.heapUsed > 500) {
      logIssue('Memory', `High heap usage: ${memUsageMB.heapUsed}MB`, 'medium');
    }
    
    // Check for potential memory leaks (simplified)
    const startHeap = memUsage.heapUsed;
    
    // Simulate some work
    for (let i = 0; i < 1000; i++) {
      await new Promise(resolve => setTimeout(resolve, 1));
    }
    
    const endHeap = process.memoryUsage().heapUsed;
    const heapDiff = Math.round((endHeap - startHeap) / 1024 / 1024);
    
    if (heapDiff > 10) {
      logIssue('Memory', `Potential memory leak detected: +${heapDiff}MB`, 'medium');
    } else {
      logInfo('Memory', `Memory usage stable: ${heapDiff > 0 ? '+' : ''}${heapDiff}MB`);
    }
    
  } catch (error) {
    logIssue('Memory', `Error checking memory usage: ${(error as Error).message}`, 'medium');
  }

  // 7. Provide Recommendations
  console.log('\n7. Recommendations');
  console.log('------------------');
  
  if (issuesFound === 0) {
    console.log('🎉 No issues found! Your configuration appears to be optimal for preventing request abandonment.');
  } else {
    console.log('📋 Recommendations to fix "request was abandoned" issues:\n');
    
    console.log('🔧 Immediate Actions:');
    console.log('• Restart Docker services: docker-compose down && docker-compose up -d');
    console.log('• Clear browser cache and cookies');
    console.log('• Check network connectivity between client and server');
    console.log('• Monitor server logs during test requests\n');
    
    console.log('⚙️ Configuration Improvements:');
    console.log('• Increase Nginx timeout settings (proxy_read_timeout, proxy_connect_timeout)');
    console.log('• Add or improve health checks in Docker services');
    console.log('• Configure restart policies for Docker services');
    console.log('• Optimize database query performance');
    console.log('• Ensure sufficient server resources (CPU, memory)\n');
    
    console.log('🔍 Monitoring:');
    console.log('• Watch Docker service logs: docker-compose logs -f');
    console.log('• Monitor Nginx access and error logs');
    console.log('• Check browser Network tab for failed requests');
    console.log('• Use browser dev tools to inspect WebSocket connections');
  }

  // Summary
  console.log('\n📊 Diagnostic Summary');
  console.log('=====================');
  console.log(`⚠️ Issues Found: ${issuesFound}`);
  console.log(`✅ Fixes Applied: ${fixesApplied}`);
  
  if (issuesFound > 0) {
    console.log('\n🚨 Priority Actions:');
    console.log('1. Fix high-severity issues first (database connectivity, missing configs)');
    console.log('2. Apply timeout and retry configuration improvements');
    console.log('3. Test the application after each fix');
    console.log('4. Monitor for "request was abandoned" errors during testing');
  }

  return issuesFound;
}

// Run diagnostics
runDiagnostics()
  .then((issuesFound) => {
    console.log(`\n🏁 Diagnostics completed. ${issuesFound} issues found.`);
    process.exit(issuesFound > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('💥 Diagnostic script failed:', error);
    process.exit(1);
  });
