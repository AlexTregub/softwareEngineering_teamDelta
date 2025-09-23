// Standalone Menu Button Test Runner
// Run this file with: node test-menu-buttons-standalone.js

const fs = require('fs');
const path = require('path');

console.log('🔍 MENU BUTTON DIAGNOSTIC - STANDALONE VERSION');
console.log('='.repeat(60));

// Read and analyze the menu.js file
const menuPath = path.join(__dirname, 'Classes', 'menu.js');

if (!fs.existsSync(menuPath)) {
  console.log('❌ CRITICAL: menu.js file not found at:', menuPath);
  process.exit(1);
}

const menuContent = fs.readFileSync(menuPath, 'utf8');

// Test 1: Check if key variables are defined
console.log('\n📋 Test 1: Variable Definitions');
const requiredVariables = [
  'gameState',
  'menuButtons',
  'GameState'
];

let variableIssues = [];
requiredVariables.forEach(variable => {
  if (menuContent.includes(`let ${variable}`) || menuContent.includes(`const ${variable}`) || menuContent.includes(`var ${variable}`)) {
    console.log(`✓ ${variable} is declared`);
  } else {
    variableIssues.push(`❌ ${variable} is not declared`);
  }
});

// Test 2: Check if key functions exist
console.log('\n🔧 Test 2: Function Definitions');
const requiredFunctions = [
  'initializeMenu',
  'setupMenu',
  'drawMainMenuButtons', 
  'drawFactionMenuButtons',
  'drawButtons',
  'handleMenuClick'
];

let functionIssues = [];
requiredFunctions.forEach(func => {
  if (menuContent.includes(`function ${func}`)) {
    console.log(`✓ ${func}() function exists`);
  } else {
    functionIssues.push(`❌ ${func}() function missing`);
  }
});

// Test 3: Check button creation logic
console.log('\n🎛️  Test 3: Button Creation Logic');
let logicIssues = [];

// Check if menuButtons array is populated in functions
if (menuContent.includes('menuButtons = [')) {
  console.log('✓ menuButtons array assignment found');
  
  // Count how many times buttons are defined
  const buttonDefinitions = (menuContent.match(/menuButtons = \[/g) || []).length;
  console.log(`✓ Found ${buttonDefinitions} menuButtons assignment(s)`);
  
  if (buttonDefinitions === 0) {
    logicIssues.push('❌ No menuButtons assignments found');
  }
} else {
  logicIssues.push('❌ No menuButtons array assignments found');
}

// Check if buttons have required properties
const buttonProperties = ['label', 'x', 'y', 'w', 'h', 'action'];
buttonProperties.forEach(prop => {
  if (menuContent.includes(`${prop}:`)) {
    console.log(`✓ Button property "${prop}" found in definitions`);
  } else {
    logicIssues.push(`❌ Button property "${prop}" not found`);
  }
});

// Test 4: Check initialization flow
console.log('\n🚀 Test 4: Initialization Flow');
let initIssues = [];

// Check if setupMenu is called in initializeMenu
if (menuContent.includes('initializeMenu')) {
  if (menuContent.includes('setupMenu()')) {
    console.log('✓ setupMenu() is called');
  } else {
    initIssues.push('❌ setupMenu() call not found');
  }
} else {
  initIssues.push('❌ initializeMenu function not found');
}

// Test 5: Check state management
console.log('\n🎮 Test 5: State Management');
let stateIssues = [];

const gameStates = ['MENU', 'FACTION_SETUP', 'PLAYING', 'OPTIONS'];
gameStates.forEach(state => {
  if (menuContent.includes(`"${state}"`)) {
    console.log(`✓ Game state "${state}" referenced`);
  } else {
    stateIssues.push(`⚠️  Game state "${state}" not found`);
  }
});

// Check if state switching logic exists
if (menuContent.includes('gameState ===')) {
  console.log('✓ State checking logic found');
} else {
  stateIssues.push('❌ No state checking logic found');
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 DIAGNOSTIC SUMMARY');
console.log('='.repeat(60));

const allIssues = [...variableIssues, ...functionIssues, ...logicIssues, ...initIssues, ...stateIssues];

if (allIssues.length === 0) {
  console.log('🎉 All static analysis tests passed!');
  console.log('💡 If buttons still aren\'t spawning, the issue is likely in the runtime execution.');
  console.log('   Check the browser console for JavaScript errors when the page loads.');
} else {
  console.log(`⚠️  Found ${allIssues.length} potential issue(s):`);
  allIssues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue}`);
  });
}

console.log('\n🔧 DEBUGGING STEPS:');
console.log('1. Open the game in browser');
console.log('2. Open browser console (F12)');
console.log('3. Look for the diagnostic test output');
console.log('4. Check for any JavaScript errors');
console.log('5. Verify that initializeMenu() is called in setup()');

console.log('\n💾 Files checked:');
console.log(`- ${menuPath}`);

if (allIssues.length > 0) {
  process.exit(1);
} else {
  process.exit(0);
}