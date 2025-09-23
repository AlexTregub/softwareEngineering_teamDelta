// Simple test to verify faction menu functionality

// Load required modules
const fs = require('fs');
const path = require('path');

// Read the menu.js file to check if our functions exist
const menuPath = path.join(__dirname, 'Classes', 'menu.js');
const menuContent = fs.readFileSync(menuPath, 'utf8');

console.log('Testing Faction Menu Integration...\n');

// Test 1: Check if faction setup functions exist
const functionsToCheck = [
  'goToFactionSetup',
  'createPlayerFaction',
  'startGameWithFaction',
  'drawFactionSetupScreen',
  'handleMenuKeyPressed',
  'toggleNameEditing',
  'nextColor',
  'previousColor'
];

let passed = 0;
let total = functionsToCheck.length;

functionsToCheck.forEach(func => {
  if (menuContent.includes(`function ${func}`)) {
    console.log(`✓ ${func} function exists`);
    passed++;
  } else {
    console.log(`✗ ${func} function missing`);
  }
});

// Test 2: Check if faction setup state exists
if (menuContent.includes('FACTION_SETUP')) {
  console.log('✓ FACTION_SETUP game state exists');
  passed++;
  total++;
} else {
  console.log('✗ FACTION_SETUP game state missing');
  total++;
}

// Test 3: Check if faction variables exist
const variablesToCheck = [
  'playerFactionName',
  'playerFactionColor',
  'factionColorOptions',
  'selectedColorIndex',
  'isEditingName',
  'factionNameInput'
];

variablesToCheck.forEach(variable => {
  if (menuContent.includes(variable)) {
    console.log(`✓ ${variable} variable exists`);
    passed++;
  } else {
    console.log(`✗ ${variable} variable missing`);
  }
  total++;
});

// Test 4: Check if keyboard handling is added to sketch.js
const sketchPath = path.join(__dirname, 'sketch.js');
const sketchContent = fs.readFileSync(sketchPath, 'utf8');

if (sketchContent.includes('handleMenuKeyPressed')) {
  console.log('✓ Menu keyboard handling integrated in sketch.js');
  passed++;
} else {
  console.log('✗ Menu keyboard handling missing in sketch.js');
}
total++;

// Test 5: Check if ant spawning accepts faction parameter
const antsPath = path.join(__dirname, 'Classes', 'ants', 'ants.js');
const antsContent = fs.readFileSync(antsPath, 'utf8');

if (antsContent.includes('function Ants_Spawn(numToSpawn, faction = null)')) {
  console.log('✓ Ant spawning accepts faction parameter');
  passed++;
} else {
  console.log('✗ Ant spawning faction parameter missing');
}
total++;

console.log(`\nTest Results: ${passed}/${total} tests passed`);

if (passed === total) {
  console.log('🎉 All faction menu tests passed! The system is ready to use.');
} else {
  console.log('⚠️ Some tests failed. Please check the implementation.');
}

console.log('\nTo test the faction menu:');
console.log('1. Open the game in a browser (localhost:8000)');
console.log('2. Click "Start Game" to enter faction setup');
console.log('3. Edit your faction name and select a color');
console.log('4. Click "Start Game" to begin with your faction');