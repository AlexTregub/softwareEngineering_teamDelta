const { DependencyDetector } = require('./dependency-detector.js');

// Get real dependencies
const detector = new DependencyDetector();
const realDeps = detector.scanRealClassDependencies('../../Classes/rendering');

// Get current test mocks from run_tests.js
const fs = require('fs');
const runTestsContent = fs.readFileSync('./run_tests.js', 'utf8');

// Extract current mocks by looking for global assignments
const currentMocks = new Set();
const mockMatches = runTestsContent.match(/global\.(\w+)\s*=/g);
if (mockMatches) {
  mockMatches.forEach(match => {
    const mockName = match.match(/global\.(\w+)/)[1];
    currentMocks.add(mockName);
  });
}

// Also look for direct function assignments
const functionMocks = runTestsContent.match(/global\.(\w+)\s*=\s*function/g);
if (functionMocks) {
  functionMocks.forEach(match => {
    const mockName = match.match(/global\.(\w+)/)[1];
    currentMocks.add(mockName);
  });
}

console.log('🔍 Mock Validation Report');
console.log('=========================');

console.log('\n✅ Current mocks provided:');
Array.from(currentMocks).sort().forEach(mock => {
  console.log(`  - ${mock}`);
});

console.log('\n📋 Real dependencies needed:');
Array.from(realDeps.dependencies).sort().forEach(dep => {
  console.log(`  - ${dep}`);
});

// Validate mocks against real dependencies
const validation = detector.validateTestMocks(Array.from(realDeps.dependencies), Object.fromEntries(Array.from(currentMocks).map(m => [m, true])));

console.log('\n🚨 Validation Results:');
if (validation.issues.length === 0) {
  console.log('  ✅ All dependencies properly mocked');
} else {
  validation.issues.forEach(issue => {
    console.log(`  ❌ ${issue.type}: ${issue.message}`);
  });
}

console.log('\n📊 Coverage Summary:');
console.log(`  - Covered: ${validation.covered.length}/${realDeps.dependencies.size} dependencies`);
console.log(`  - Missing: ${validation.missing.length} dependencies`);
console.log(`  - Extra: ${validation.extra.length} outdated mocks`);

if (validation.missing.length > 0) {
  console.log('\n🔧 Missing mocks needed:');
  validation.missing.forEach(dep => {
    const category = Object.keys(realDeps.byCategory).find(cat => realDeps.byCategory[cat].includes(dep)) || 'unknown';
    console.log(`  - ${dep} (${category})`);
  });
}

if (validation.extra.length > 0) {
  console.log('\n🧹 Outdated mocks to consider removing:');
  validation.extra.forEach(dep => {
    console.log(`  - ${dep}`);
  });
}