// Debug Command Line Interface
// Provides a visual command line for debugging and testing the ant game

// COMMAND LINE STATE
let commandLineActive = false;
let commandInput = "";
let commandHistory = [];
let actualCommands = []; // Store actual command inputs separately from output
let commandHistoryIndex = -1;
let consoleOutput = []; // Store console output for display
let scrollOffset = 0; // For scrolling through output

// Console capture system
let originalConsoleLog = console.log;
console.log = function(...args) {
  // Call original console.log
  originalConsoleLog.apply(console, args);
  
  // Capture output for command line display
  if (commandLineActive) {
    let message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    consoleOutput.unshift(message);
    if (consoleOutput.length > 100) consoleOutput.pop(); // Limit to 100 lines
  }
};

// COMMAND LINE INPUT HANDLER
function handleCommandLineInput() {
  // Only process if command line is active
  if (!commandLineActive) {
    return;
  }
  
  // Handle scroll first (when Shift is pressed)
  if (keyIsDown && keyIsDown(16)) { // 16 is SHIFT keyCode
    handleCommandLineScroll();
    return; // Don't process other keys when scrolling
  }
  
  if (keyCode === 13) { // ENTER
    // Execute command
    if (commandInput.trim() !== "") {
      // Add to actual commands list for history navigation
      actualCommands.unshift(commandInput.trim());
      if (actualCommands.length > 50) actualCommands.pop();
      
      // Add command to history and output
      commandHistory.unshift(`> ${commandInput.trim()}`);
      consoleOutput.unshift(`> ${commandInput.trim()}`);
      
      executeCommand(commandInput.trim());
      
      if (commandHistory.length > 100) commandHistory.pop();
      if (consoleOutput.length > 100) consoleOutput.pop();
    }
    // Reset input and scroll
    commandInput = "";
    commandHistoryIndex = -1;
    scrollOffset = 0; // Reset scroll to show latest output
  } else if (keyCode === 27) { // ESCAPE
    // Cancel command input
    commandLineActive = false;
    commandInput = "";
    commandHistoryIndex = -1;
    console.log("💻 Command line cancelled.");
  } else if (keyCode === 8) { // BACKSPACE
    // Remove last character
    commandInput = commandInput.slice(0, -1);
  } else if (keyCode === 38) { // UP_ARROW
    // Navigate command history up
    if (actualCommands.length > 0 && commandHistoryIndex < actualCommands.length - 1) {
      commandHistoryIndex++;
      commandInput = actualCommands[commandHistoryIndex];
    }
  } else if (keyCode === 40) { // DOWN_ARROW
    // Navigate command history down
    if (commandHistoryIndex > 0) {
      commandHistoryIndex--;
      commandInput = actualCommands[commandHistoryIndex];
    } else if (commandHistoryIndex === 0) {
      commandHistoryIndex = -1;
      commandInput = "";
    }
  } else if (key && key.length === 1) {
    // Add typed character
    commandInput += key;
  }
}

// Add scroll handling for the output area
function handleCommandLineScroll() {
  if (commandLineActive) {
    if (keyCode === 38) { // UP_ARROW
      // Scroll up (show older messages)
      scrollOffset = Math.min(scrollOffset + 1, Math.max(0, consoleOutput.length - 10));
    } else if (keyCode === 40) { // DOWN_ARROW
      // Scroll down (show newer messages)
      scrollOffset = Math.max(scrollOffset - 1, 0);
    } else if (keyCode === 33) { // PAGE_UP
      // Page up
      scrollOffset = Math.min(scrollOffset + 10, Math.max(0, consoleOutput.length - 10));
    } else if (keyCode === 34) { // PAGE_DOWN
      // Page down
      scrollOffset = Math.max(scrollOffset - 10, 0);
    }
  }
}

// COMMAND PROCESSOR
function executeCommand(command) {
  console.log(`💻 > ${command}`);
  
  const parts = command.toLowerCase().split(' ');
  const cmd = parts[0];
  const args = parts.slice(1);
  
  switch (cmd) {
    case 'help':
      showCommandHelp();
      break;
      
    case 'spawn':
      handleSpawnCommand(args);
      break;
      
    case 'clear':
      consoleOutput = []; // Clear command line output
      scrollOffset = 0;   // Reset scroll
      console.log("💻 Console cleared.");
      break;
      
    case 'debug':
      handleDebugCommand(args);
      break;
      
    case 'select':
      handleSelectCommand(args);
      break;
      
    case 'kill':
      handleKillCommand(args);
      break;
      
    case 'teleport':
    case 'tp':
      handleTeleportCommand(args);
      break;
      
    case 'info':
      showGameInfo();
      break;
      
    default:
      console.log(`❌ Unknown command: ${cmd}. Type 'help' for available commands.`);
  }
}

// COMMAND IMPLEMENTATIONS
function showCommandHelp() {
  console.log("💻 Available Commands:");
  console.log("  help - Show this help message");
  console.log("  spawn <count> [type] [faction] - Spawn ants (e.g., 'spawn 5 ant player')");
  console.log("  clear - Clear console output");
  console.log("  debug <on|off> - Toggle debug logging");
  console.log("  select <all|none|index> - Select entities");
  console.log("  kill <all|selected|index> - Remove entities");
  console.log("  teleport <x> <y> - Move selected ant to coordinates");
  console.log("  info - Show game state information");
  console.log("  ");
  console.log("Examples:");
  console.log("  spawn 10 ant blue");
  console.log("  teleport 100 200");
  console.log("  select all");
}

function handleSpawnCommand(args) {
  const count = parseInt(args[0]) || 1;
  const type = args[1] || 'ant';
  const faction = args[2] || 'neutral';
  
  if (count < 1 || count > 100) {
    console.log("❌ Spawn count must be between 1 and 100");
    return;
  }
  
  console.log(`🐜 Spawning ${count} ${type}(s) with faction: ${faction}`);
  
  // Record the starting ant count
  const startingCount = ant_Index;
  
  // Spawn ants using the same method as the original Ants_Spawn function
  for (let i = 0; i < count; i++) {
    try {
      // Create the base ant (this increments ant_Index)
      let sizeR = random(0, 15);
      let baseAnt = new ant(random(0, width-50), random(0, height-50), 20 + sizeR, 20 + sizeR, 30, 0);
      let JobName = assignJob();
      
      // Create Job object which extends ant but doesn't increment ant_Index again
      // We need to temporarily decrement ant_Index to avoid double counting
      let tempIndex = ant_Index;
      ant_Index--;  // Temporarily decrement
      let JobAnt = new Job(baseAnt, JobName, JobImages[JobName]);
      ant_Index = tempIndex;  // Restore to the correct value
      
        // Always push new ants to the end of the array
        let antWrapper = new AntWrapper(JobAnt, JobName);
        ants.push(antWrapper);
        // Ensure the ant wrapper is properly constructed
        if (!antWrapper || !antWrapper.antObject) {
          console.log(`❌ Failed to create ant ${i + 1}`);
          continue;
        }
        // Set faction if specified
        if (faction !== 'neutral') {
          const antObj = antWrapper.antObject ? antWrapper.antObject : antWrapper;
          if (antObj) {
            antObj.faction = faction;
          }
        }
    } catch (error) {
      console.log(`❌ Error creating ant ${i + 1}: ${error.message}`);
    }
  }
  
  const actualSpawned = ant_Index - startingCount;
  console.log(`✅ Spawned ${actualSpawned} ants. Total ants: ${ant_Index}`);
  // Ensure SelectionBoxController sees new ants
  if (typeof selectionBoxController !== 'undefined' && selectionBoxController) {
    selectionBoxController.entities = ants;
  }
}

function handleDebugCommand(args) {
  if (args.length === 0) {
    console.log(`🛠️  Debug logging is currently: ${devConsoleEnabled ? 'ON' : 'OFF'}`);
    return;
  }
  
  const setting = args[0].toLowerCase();
  if (setting === 'on' || setting === 'true') {
    devConsoleEnabled = true;
    console.log("🛠️  Debug logging enabled");
  } else if (setting === 'off' || setting === 'false') {
    devConsoleEnabled = false;
    console.log("🛠️  Debug logging disabled");
  } else {
    console.log("❌ Use 'debug on' or 'debug off'");
  }
}

function handleSelectCommand(args) {
  if (args.length === 0) {
    console.log("❌ Specify 'all', 'none', or an ant index");
    return;
  }
  
  const target = args[0].toLowerCase();
  
  if (target === 'all') {
    let count = 0;
    for (let i = 0; i < ant_Index; i++) {
      if (ants[i]) {
        const antObj = ants[i].antObject ? ants[i].antObject : ants[i];
        if (antObj) {
          antObj.isSelected = true;
          count++;
        }
      }
    }
    console.log(`✅ Selected ${count} ants`);
  } else if (target === 'none') {
    for (let i = 0; i < ant_Index; i++) {
      if (ants[i]) {
        const antObj = ants[i].antObject ? ants[i].antObject : ants[i];
        if (antObj) {
          antObj.isSelected = false;
        }
      }
    }
    selectedAnt = null;
    console.log("✅ Deselected all ants");
  } else {
    const index = parseInt(target);
    if (isNaN(index) || index < 0 || index >= ant_Index || !ants[index]) {
      console.log(`❌ Invalid ant index: ${target}`);
      return;
    }
    
    // Deselect all first
    for (let i = 0; i < ant_Index; i++) {
      if (ants[i]) {
        const antObj = ants[i].antObject ? ants[i].antObject : ants[i];
        if (antObj) antObj.isSelected = false;
      }
    }
    
    // Select target ant
    const antObj = ants[index].antObject ? ants[index].antObject : ants[index];
    if (antObj) {
      antObj.isSelected = true;
      selectedAnt = antObj;
      console.log(`✅ Selected ant ${index}`);
    }
  }
}

function handleKillCommand(args) {
  if (args.length === 0) {
    console.log("❌ Specify 'all', 'selected', or an ant index");
    return;
  }
  
  const target = args[0].toLowerCase();
  
  if (target === 'all') {
    const count = ant_Index;
    ants = [];
    ant_Index = 0;
    selectedAnt = null;
    console.log(`💀 Removed all ${count} ants`);
  } else if (target === 'selected') {
    let count = 0;
    for (let i = ant_Index - 1; i >= 0; i--) {
      if (ants[i]) {
        const antObj = ants[i].antObject ? ants[i].antObject : ants[i];
        if (antObj && antObj.isSelected) {
          ants.splice(i, 1);
          count++;
        }
      }
    }
    ant_Index = ants.length;
    selectedAnt = null;
    console.log(`💀 Removed ${count} selected ants`);
  } else {
    const index = parseInt(target);
    if (isNaN(index) || index < 0 || index >= ant_Index || !ants[index]) {
      console.log(`❌ Invalid ant index: ${target}`);
      return;
    }
    
    ants.splice(index, 1);
    ant_Index = ants.length;
    selectedAnt = null;
    console.log(`💀 Removed ant ${index}`);
  }
}

function handleTeleportCommand(args) {
  if (args.length < 2) {
    console.log("❌ Usage: teleport <x> <y>");
    return;
  }
  
  const x = parseInt(args[0]);
  const y = parseInt(args[1]);
  
  if (isNaN(x) || isNaN(y)) {
    console.log("❌ Coordinates must be numbers");
    return;
  }
  
  if (!selectedAnt) {
    console.log("❌ No ant selected. Use 'select <index>' first.");
    return;
  }
  
  selectedAnt.setPosition(x, y);
  console.log(`🚀 Teleported selected ant to (${x}, ${y})`);
}

function showGameInfo() {
  console.log("🎮 Game State Information:");
  console.log(`  Total Ants: ${ant_Index}`);
  console.log(`  Canvas Size: ${width} x ${height}`);
  console.log(`  Dev Console: ${devConsoleEnabled ? 'ON' : 'OFF'}`);
  console.log(`  Selected Ant: ${selectedAnt ? 'Yes' : 'None'}`);
  
  // Count ants by faction
  const factions = {};
  for (let i = 0; i < ant_Index; i++) {
    if (ants[i]) {
      const antObj = ants[i].antObject ? ants[i].antObject : ants[i];
      if (antObj && antObj.faction) {
        factions[antObj.faction] = (factions[antObj.faction] || 0) + 1;
      }
    }
  }
  
  if (Object.keys(factions).length > 0) {
    console.log("  Factions:");
    for (const [faction, count] of Object.entries(factions)) {
      console.log(`    ${faction}: ${count} ants`);
    }
  }
}

// COMMAND LINE INTERFACE RENDERING
function drawCommandLine() {
  if (commandLineActive && devConsoleEnabled) {
    push();
    
    // Semi-transparent gray background overlay
    fill(0, 0, 0, 120);
    noStroke();
    rect(0, 0, width, height);
    
    // Calculate command line area dimensions
    let boxHeight = 40;
    let historyHeight = 200; // Height for command history area
    let boxY = 20; // Position at top
    let boxX = 20;
    let boxWidth = width - 40;
    
    // Draw main command input box (at the top)
    fill(50, 50, 50, 220);
    stroke(100, 100, 100);
    strokeWeight(2);
    rect(boxX, boxY, boxWidth, boxHeight, 5);
    
    // Prompt symbol
    fill(0, 255, 0);
    noStroke();
    textAlign(LEFT, CENTER);
    textSize(16);
    text(">", boxX + 10, boxY + boxHeight/2);
    
    // Command input text
    fill(255);
    textAlign(LEFT, CENTER);
    textSize(14);
    let textX = boxX + 30;
    text(commandInput, textX, boxY + boxHeight/2);
    
    // Blinking cursor
    if (frameCount % 60 < 30) { // Blink every second
      let cursorX = textX + textWidth(commandInput);
      stroke(255);
      strokeWeight(2);
      line(cursorX, boxY + 8, cursorX, boxY + boxHeight - 8);
    }
    
    // Help text below command input
    fill(200, 200, 200, 180);
    noStroke();
    textAlign(LEFT);
    textSize(11);
    let helpY = boxY + boxHeight + 5;
    text("Type command and press Enter, or Escape to cancel. Up/Down for command history.", boxX, helpY);
    text("Hold Shift + Up/Down/PageUp/PageDown to scroll output. Type 'help' for available commands.", boxX, helpY + 15);
    
    // Draw console output background (below input)
    let outputY = boxY + boxHeight + 35; // Position below input and help text
    fill(30, 30, 30, 200);
    stroke(80, 80, 80);
    strokeWeight(1);
    rect(boxX, outputY, boxWidth, historyHeight, 5);
    
    // Draw console output (scrollable)
    fill(180, 180, 180);
    noStroke();
    textAlign(LEFT, TOP);
    
    let lineHeight = 14;
    let startY = outputY + 10;
    let maxLines = Math.floor((historyHeight - 20) / lineHeight);
    
    // Show header with scroll info
    fill(220, 220, 220);
    textSize(11);
    let scrollInfo = scrollOffset > 0 ? ` (scrolled +${scrollOffset})` : "";
    text(`Console Output${scrollInfo}:`, boxX + 10, startY);
    startY += 20;
    
    // Display console output with scrolling
    fill(160, 160, 160);
    textSize(9);
    
    let outputToShow = consoleOutput.slice(scrollOffset, scrollOffset + maxLines);
    for (let i = 0; i < outputToShow.length; i++) {
      let outputLineY = startY + (i * lineHeight);
      if (outputLineY < outputY + historyHeight - 10) {
        let line = outputToShow[i];
        
        // Color code different types of output
        if (line.startsWith('> ')) {
          fill(100, 255, 100); // Green for commands
        } else if (line.includes('❌')) {
          fill(255, 100, 100); // Red for errors
        } else if (line.includes('✅')) {
          fill(100, 255, 100); // Green for success
        } else if (line.includes('🛠️') || line.includes('💻')) {
          fill(255, 255, 100); // Yellow for system messages
        } else {
          fill(200, 200, 200); // Default gray
        }
        
        // Wrap long lines
        let maxWidth = boxWidth - 30;
        if (textWidth(line) > maxWidth) {
          let words = line.split(' ');
          let currentLine = '';
          for (let word of words) {
            if (textWidth(currentLine + word + ' ') > maxWidth) {
              text(currentLine, boxX + 15, outputLineY);
              outputLineY += lineHeight;
              currentLine = word + ' ';
            } else {
              currentLine += word + ' ';
            }
          }
          if (currentLine.trim()) {
            text(currentLine, boxX + 15, outputLineY);
          }
        } else {
          text(line, boxX + 15, outputLineY);
        }
      }
    }
    
    // If no output, show placeholder
    if (consoleOutput.length === 0) {
      fill(120, 120, 120);
      textAlign(CENTER, CENTER);
      text("No console output yet. Try typing 'help'", boxX + boxWidth/2, outputY + historyHeight/2);
    }
    
    // Show scroll indicator if there's more content
    if (consoleOutput.length > maxLines) {
      fill(255, 255, 100, 150);
      textAlign(RIGHT);
      textSize(9);
      text(`${scrollOffset + outputToShow.length}/${consoleOutput.length} lines`, boxX + boxWidth - 10, outputY + historyHeight - 5);
    }
    
    pop();
  }
}

// INTEGRATION FUNCTIONS
function openCommandLine() {
  if (devConsoleEnabled && !commandLineActive) {
    commandLineActive = true;
    commandInput = "";
    console.log("💻 Command line activated. Type 'help' for available commands.");
    return true;
  }
  return false;
}

function closeCommandLine() {
  commandLineActive = false;
  commandInput = "";
  commandHistoryIndex = -1;
}

function isCommandLineActive() {
  return commandLineActive;
}