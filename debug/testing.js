/**
 * Debug Testing Module
 * Handles all debug console functionality and test hotkeys
 */

// DEV CONSOLE STATE
let devConsoleEnabled = false;

// DEBUG LOGGING HELPER
function debugLog(message, ...args) {
  if (devConsoleEnabled) {
    console.log(message, ...args);
  }
}

// DEV CONSOLE MANAGEMENT
function isDevConsoleEnabled() {
  return devConsoleEnabled;
}

function toggleDevConsole() {
  devConsoleEnabled = !devConsoleEnabled;
  if (devConsoleEnabled) {
    console.log("🛠️  DEV CONSOLE ENABLED");
    console.log("📋 Available commands:");
    console.log("   T - Run Selection Box Tests");
    console.log("   P - Run Performance Tests");
    console.log("   I - Run Integration Tests");
    console.log("   Enter - Open Command Line");
    console.log("   ` - Toggle Dev Console");
  } else {
    console.log("🛠️  DEV CONSOLE DISABLED");
    closeCommandLine(); // Close command line when dev console is disabled
  }
}

// TEST HOTKEY HANDLERS
function handleTestHotkeys(key) {
  if (!devConsoleEnabled) {
    if ((key === 't' || key === 'T') || (key === 'p' || key === 'P') || (key === 'i' || key === 'I')) {
      console.log("🛠️  Dev console is disabled. Press ` to enable testing commands.");
    }
    return false;
  }

  // Handle test hotkeys when dev console is enabled
  if (key === 't' || key === 'T') {
    console.log("🧪 Running Selection Box Tests...");
    if (typeof runSelectionBoxTests === 'function') {
      runSelectionBoxTests();
    } else {
      console.log("❌ Test functions not loaded");
    }
    return true;
  }
  
  if (key === 'p' || key === 'P') {
    console.log("⚡ Running Performance Tests...");
    if (typeof testSelectionPerformance === 'function') {
      testSelectionPerformance();
    } else {
      console.log("❌ Performance test function not loaded");
    }
    return true;
  }
  
  if (key === 'i' || key === 'I') {
    console.log("🔗 Running Integration Tests...");
    if (typeof testRealSelectionBoxIntegration === 'function') {
      testRealSelectionBoxIntegration();
      testSelectionScenarios();
    } else {
      console.log("❌ Integration test functions not loaded");
    }
    return true;
  }

  return false; // Key not handled
}

// DEV CONSOLE VISUAL INDICATOR
function drawDevConsoleIndicator() {
  if (devConsoleEnabled) {
    // Draw dev console indicator in top-right corner
    push();
    fill(0, 255, 0, 200); // Semi-transparent green
    stroke(0, 255, 0);
    strokeWeight(2);
    
    // Background box
    let boxWidth = 120;
    let boxHeight = 25;
    rect(width - boxWidth - 10, 10, boxWidth, boxHeight);
    
    // Text
    fill(0);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(12);
    text("DEV CONSOLE ON", width - boxWidth/2 - 10, 22);
    
    // Small help text
    fill(255, 255, 255, 180);
    textAlign(RIGHT);
    textSize(10);
    text("Press ` to toggle", width - 15, 45);
    
    // Command line hint
    if (!isCommandLineActive()) {
      textAlign(RIGHT);
      textSize(9);
      fill(255, 255, 0, 150);
      text("Press Enter for command line", width - 15, 58);
    }
    
    pop();
  }
}

// COMMAND LINE INTEGRATION
function handleDebugConsoleKeys(keyCode, key) {
  // Handle command line input when active
  if (isCommandLineActive()) {
    handleCommandLineInput();
    // Also handle scrolling when command line is active
    if (typeof handleCommandLineScroll === 'function') {
      handleCommandLineScroll();
    }
    return true; // Key handled
  }
  
  // Toggle dev console with ` key (backtick)
  if (key === '`') {
    toggleDevConsole();
    return true;
  }
  
  // Open command line with Enter key (only when dev console is enabled)
  if (devConsoleEnabled && keyCode === ENTER && !isCommandLineActive()) {
    openCommandLine();
    return true;
  }
  
  // Handle test hotkeys
  return handleTestHotkeys(key);
}