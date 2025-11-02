/**
 * Run All Level Loading E2E Tests
 * ================================
 * Executes all level loading E2E tests in sequence
 * 
 * Tests:
 * 1. Load Custom Level from Menu
 * 2. Queen Movement in IN_GAME
 * 3. Terrain Rendering
 * 4. Camera Following Queen
 */

const { execSync } = require('child_process');
const path = require('path');

const tests = [
  {
    name: 'Load Custom Level from Menu',
    file: 'pw_load_custom_level.js',
    description: 'Verifies CaveTutorial.json loads from main menu button'
  },
  {
    name: 'Queen Movement in IN_GAME',
    file: 'pw_queen_movement.js',
    description: 'Verifies queen can move in custom loaded level'
  },
  {
    name: 'Terrain Rendering',
    file: 'pw_terrain_rendering.js',
    description: 'Verifies custom terrain tiles render correctly'
  },
  {
    name: 'Camera Following Queen',
    file: 'pw_camera_following.js',
    description: 'Verifies camera tracks queen movement'
  }
];

console.log('========================================');
console.log('Level Loading E2E Test Suite');
console.log('========================================\n');

let passed = 0;
let failed = 0;
const results = [];

for (const test of tests) {
  console.log(`\n[TEST] ${test.name}`);
  console.log(`[DESC] ${test.description}`);
  console.log(`[FILE] ${test.file}`);
  console.log('----------------------------------------');
  
  try {
    const testPath = path.join(__dirname, test.file);
    execSync(`node "${testPath}"`, {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    console.log(`[RESULT] ✅ PASSED\n`);
    passed++;
    results.push({ name: test.name, status: 'PASSED' });
  } catch (error) {
    console.log(`[RESULT] ❌ FAILED\n`);
    failed++;
    results.push({ name: test.name, status: 'FAILED' });
  }
}

console.log('\n========================================');
console.log('Test Suite Complete');
console.log('========================================');
console.log(`Total: ${tests.length} tests`);
console.log(`Passed: ${passed} ✅`);
console.log(`Failed: ${failed} ❌`);
console.log('========================================\n');

console.log('Individual Results:');
results.forEach(r => {
  const icon = r.status === 'PASSED' ? '✅' : '❌';
  console.log(`  ${icon} ${r.name}`);
});

console.log('\n========================================\n');

if (failed > 0) {
  console.log('⚠️  Some tests failed. Check screenshots in test/e2e/screenshots/');
  process.exit(1);
} else {
  console.log('🎉 All tests passed!');
  process.exit(0);
}
