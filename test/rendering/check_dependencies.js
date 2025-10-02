const { DependencyDetector } = require('./dependency-detector.js');

const detector = new DependencyDetector();
const result = detector.scanRealClassDependencies('../../Classes/rendering');

console.log('🔍 Real Rendering Class Dependencies:');
console.log('=====================================');

console.log('\n📋 Dependencies by category:');
console.log(JSON.stringify(result.byCategory, null, 2));

console.log('\n📄 Dependencies by file:');
Object.entries(result.byFile).forEach(([file, deps]) => {
  console.log(`  ${file}: ${deps.join(', ') || 'none'}`);
});

console.log('\n⚠️ Validation warnings:');
if (result.warnings.length === 0) {
  console.log('  No warnings');
} else {
  result.warnings.forEach(w => {
    console.log(`  - ${w.type}: ${w.message}`);
    console.log(`    Action: ${w.action}`);
  });
}

console.log(`\n📊 Total dependencies found: ${result.dependencies.size}`);