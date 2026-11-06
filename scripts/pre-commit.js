#!/usr/bin/env node
const { execSync } = require('child_process');

console.log('🔍 Running pre-commit verification checks...');

try {
  console.log('1. Linting workspaces...');
  execSync('npm run lint', { stdio: 'inherit' });

  console.log('2. Typechecking TypeScript project references...');
  execSync('npx tsc -b', { stdio: 'inherit' });

  console.log('✅ All pre-commit checks passed successfully.');
  process.exit(0);
} catch (error) {
  console.error('❌ Pre-commit check failed. Please resolve errors before committing.');
  process.exit(1);
}
