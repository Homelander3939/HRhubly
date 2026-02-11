#!/usr/bin/env node

/**
 * Cross-platform public preview launcher
 * Detects the operating system and runs the appropriate tunnel setup script
 */

const { execSync } = require('child_process');
const path = require('path');

const isWindows = process.platform === 'win32';
const scriptName = isWindows ? 'start-public-preview.bat' : 'start-public-preview.sh';
const scriptPath = path.join(__dirname, scriptName);

try {
  // Execute the appropriate script based on platform
  const command = isWindows ? scriptPath : `bash "${scriptPath}"`;
  
  execSync(command, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
} catch (error) {
  // Error already displayed by the child script
  process.exit(error.status || 1);
}
