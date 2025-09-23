// Menu Button Diagnostic Test
// This test will alert you to issues with menu button spawning and functionality

console.log("=== MENU BUTTON DIAGNOSTIC TEST ===");

// Test 1: Check if menu variables are properly initialized
function testMenuVariablesInitialization() {
  console.log("\n🔍 Test 1: Menu Variables Initialization");
  
  let issues = [];
  
  // Check if GameState enum exists
  if (typeof GameState === 'undefined') {
    issues.push("❌ GameState enum is not defined");
  } else {
    console.log("✓ GameState enum exists");
  }
  
  // Check if gameState variable exists
  if (typeof gameState === 'undefined') {
    issues.push("❌ gameState variable is not defined");
  } else {
    console.log(`✓ gameState variable exists (current value: ${gameState})`);
  }
  
  // Check if menuButtons array exists
  if (typeof menuButtons === 'undefined') {
    issues.push("❌ menuButtons array is not defined");
  } else {
    console.log(`✓ menuButtons array exists (length: ${menuButtons.length})`);
  }
  
  // Check canvas dimensions
  if (typeof CANVAS_X === 'undefined' || typeof CANVAS_Y === 'undefined') {
    issues.push("❌ Canvas dimensions (CANVAS_X, CANVAS_Y) are not defined");
  } else {
    console.log(`✓ Canvas dimensions defined (${CANVAS_X}x${CANVAS_Y})`);
  }
  
  return issues;
}

// Test 2: Check if menu setup functions exist
function testMenuFunctionsExist() {
  console.log("\n🔍 Test 2: Menu Functions Existence");
  
  let issues = [];
  const requiredFunctions = [
    'initializeMenu',
    'setupMenu', 
    'drawMainMenuButtons',
    'drawFactionMenuButtons',
    'drawButtons',
    'handleMenuClick'
  ];
  
  requiredFunctions.forEach(funcName => {
    if (typeof window[funcName] === 'undefined' && typeof eval(`typeof ${funcName}`) === 'undefined') {
      issues.push(`❌ Function '${funcName}' is not defined`);
    } else {
      console.log(`✓ Function '${funcName}' exists`);
    }
  });
  
  return issues;
}

// Test 3: Check button spawning behavior
function testButtonSpawning() {
  console.log("\n🔍 Test 3: Button Spawning Behavior");
  
  let issues = [];
  
  // Test main menu button spawning
  console.log("Testing main menu button spawning...");
  
  // Save current state
  const originalGameState = gameState;
  const originalMenuButtons = [...menuButtons];
  
  try {
    // Set to main menu state
    gameState = GameState.MENU || "MENU";
    
    // Try to spawn main menu buttons
    if (typeof drawMainMenuButtons === 'function') {
      drawMainMenuButtons();
      
      if (menuButtons.length === 0) {
        issues.push("❌ drawMainMenuButtons() called but menuButtons array is empty");
      } else {
        console.log(`✓ Main menu buttons created (count: ${menuButtons.length})`);
        
        // Check button structure
        menuButtons.forEach((btn, index) => {
          if (!btn.label || !btn.action || btn.x === undefined || btn.y === undefined) {
            issues.push(`❌ Button ${index} has invalid structure: ${JSON.stringify(btn)}`);
          } else {
            console.log(`✓ Button ${index}: "${btn.label}" at (${btn.x}, ${btn.y})`);
          }
        });
      }
    } else {
      issues.push("❌ drawMainMenuButtons function is not callable");
    }
    
    // Test faction menu button spawning
    console.log("Testing faction menu button spawning...");
    gameState = GameState.FACTION_SETUP || "FACTION_SETUP";
    
    if (typeof drawFactionMenuButtons === 'function') {
      drawFactionMenuButtons();
      
      if (menuButtons.length === 0) {
        issues.push("❌ drawFactionMenuButtons() called but menuButtons array is empty");
      } else {
        console.log(`✓ Faction menu buttons created (count: ${menuButtons.length})`);
      }
    } else {
      issues.push("❌ drawFactionMenuButtons function is not callable");
    }
    
  } catch (error) {
    issues.push(`❌ Error during button spawning test: ${error.message}`);
  } finally {
    // Restore original state
    gameState = originalGameState;
    menuButtons = originalMenuButtons;
  }
  
  return issues;
}

// Test 4: Check if setupMenu is being called properly
function testSetupMenuCalls() {
  console.log("\n🔍 Test 4: setupMenu Call Chain");
  
  let issues = [];
  
  // Check if setupMenu exists
  if (typeof setupMenu !== 'function') {
    issues.push("❌ setupMenu function does not exist");
    return issues;
  }
  
  // Test setupMenu behavior
  const originalGameState = gameState;
  const originalMenuButtons = [...menuButtons];
  
  try {
    // Test MENU state
    gameState = GameState.MENU || "MENU";
    menuButtons = []; // Clear buttons
    
    setupMenu();
    
    if (menuButtons.length === 0) {
      issues.push("❌ setupMenu() called for MENU state but no buttons created");
    } else {
      console.log(`✓ setupMenu() created ${menuButtons.length} buttons for MENU state`);
    }
    
    // Test FACTION_SETUP state
    gameState = GameState.FACTION_SETUP || "FACTION_SETUP";
    menuButtons = []; // Clear buttons
    
    setupMenu();
    
    if (menuButtons.length === 0) {
      issues.push("❌ setupMenu() called for FACTION_SETUP state but no buttons created");
    } else {
      console.log(`✓ setupMenu() created ${menuButtons.length} buttons for FACTION_SETUP state`);
    }
    
  } catch (error) {
    issues.push(`❌ Error during setupMenu test: ${error.message}`);
  } finally {
    // Restore original state
    gameState = originalGameState;
    menuButtons = originalMenuButtons;
  }
  
  return issues;
}

// Test 5: Check initialization flow
function testInitializationFlow() {
  console.log("\n🔍 Test 5: Initialization Flow");
  
  let issues = [];
  
  // Check if initializeMenu exists and is being called
  if (typeof initializeMenu !== 'function') {
    issues.push("❌ initializeMenu function does not exist");
  } else {
    console.log("✓ initializeMenu function exists");
    
    // Test if it creates buttons
    const originalMenuButtons = [...menuButtons];
    menuButtons = []; // Clear buttons
    
    try {
      initializeMenu();
      
      if (menuButtons.length === 0) {
        issues.push("❌ initializeMenu() called but no buttons were created");
      } else {
        console.log(`✓ initializeMenu() created ${menuButtons.length} buttons`);
      }
    } catch (error) {
      issues.push(`❌ Error calling initializeMenu(): ${error.message}`);
    } finally {
      menuButtons = originalMenuButtons;
    }
  }
  
  return issues;
}

// Run all tests
function runMenuButtonDiagnostics() {
  console.log("Starting comprehensive menu button diagnostics...\n");
  
  const allIssues = [
    ...testMenuVariablesInitialization(),
    ...testMenuFunctionsExist(),
    ...testButtonSpawning(),
    ...testSetupMenuCalls(),
    ...testInitializationFlow()
  ];
  
  console.log("\n" + "=".repeat(50));
  console.log("📊 DIAGNOSTIC SUMMARY");
  console.log("=".repeat(50));
  
  if (allIssues.length === 0) {
    console.log("🎉 All tests passed! Menu button system appears to be working correctly.");
  } else {
    console.log(`⚠️  Found ${allIssues.length} issue(s):`);
    allIssues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
    
    console.log("\n💡 Recommended actions:");
    if (allIssues.some(issue => issue.includes('GameState'))) {
      console.log("- Check if GameState enum is properly defined and loaded");
    }
    if (allIssues.some(issue => issue.includes('CANVAS_X'))) {
      console.log("- Ensure canvas dimensions are set before menu initialization");
    }
    if (allIssues.some(issue => issue.includes('Function') && issue.includes('not defined'))) {
      console.log("- Check if all menu functions are properly defined in menu.js");
    }
    if (allIssues.some(issue => issue.includes('setupMenu'))) {
      console.log("- Verify setupMenu() logic and ensure it's called after initialization");
    }
    if (allIssues.some(issue => issue.includes('initializeMenu'))) {
      console.log("- Make sure initializeMenu() is called in the setup() function");
    }
  }
  
  return allIssues;
}

// Auto-run the diagnostics
if (typeof window !== 'undefined') {
  // Browser environment - run after a short delay to ensure everything is loaded
  setTimeout(runMenuButtonDiagnostics, 1000);
} else {
  // Node.js environment - run immediately
  runMenuButtonDiagnostics();
}