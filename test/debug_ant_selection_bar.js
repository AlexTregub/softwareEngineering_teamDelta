/**
 * Debug script to test AntSelectionBar button creation
 */

// Mock dependencies
global.window = {};
global.UICoordinateConverter = class {
  constructor() {}
  normalizedToScreen(x, y) {
    return { x: 400, y: 500 };
  }
};

// Mock p5
const mockP5 = {
  loadImage: (path, success, error) => {
    // Simulate successful image load
    if (success) success({ width: 32, height: 32 });
  },
  mouseX: 0,
  mouseY: 0,
  push: () => {},
  pop: () => {},
  fill: () => {},
  stroke: () => {},
  strokeWeight: () => {},
  noStroke: () => {},
  rect: () => {},
  ellipse: () => {},
  image: () => {},
  imageMode: () => {},
  noSmooth: () => {},
  textAlign: () => {},
  textSize: () => {},
  textStyle: () => {},
  text: () => {},
  CENTER: 'center',
  LEFT: 'left',
  BOTTOM: 'bottom',
  BOLD: 'bold',
  NORMAL: 'normal'
};

const AntSelectionBar = require('../Classes/ui_new/components/AntSelectionBar.js');

console.log('=== Testing AntSelectionBar ===\n');

const bar = new AntSelectionBar(mockP5, {});

console.log('Job Types:', bar.jobTypes);
console.log('\nButtons created:', bar.buttons.length);
console.log('Expected: 6\n');

bar.buttons.forEach((btn, i) => {
  console.log(`Button ${i}:`);
  console.log(`  jobType: ${btn.jobType}`);
  console.log(`  jobName: ${btn.jobName}`);
  console.log(`  keybind: ${btn.keybind}`);
  console.log(`  isQueen: ${btn.isQueen}`);
  console.log(`  width: ${btn.width}`);
  console.log(`  height: ${btn.height}`);
  console.log(`  x: ${btn.x}`);
  console.log(`  y: ${btn.y}`);
  console.log(`  hasSprite: ${!!btn.sprite}`);
  console.log('');
});

// Check for issues
const issues = [];
bar.buttons.forEach((btn, i) => {
  if (!btn.jobName) issues.push(`Button ${i} missing jobName`);
  if (!btn.keybind) issues.push(`Button ${i} missing keybind`);
  if (!btn.jobType) issues.push(`Button ${i} missing jobType`);
});

if (issues.length > 0) {
  console.log('❌ ISSUES FOUND:');
  issues.forEach(issue => console.log(`  - ${issue}`));
} else {
  console.log('✅ All buttons have required properties');
}

// Test sprite loading
console.log('\nSprite paths:');
Object.keys(bar.spritePaths).forEach(key => {
  console.log(`  ${key}: ${bar.spritePaths[key]}`);
});

console.log('\nLoaded sprites:');
Object.keys(bar.sprites).forEach(key => {
  console.log(`  ${key}: ${bar.sprites[key] ? 'loaded' : 'not loaded'}`);
});
