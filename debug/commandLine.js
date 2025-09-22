// Debug Command Line Interface
// Provides a visual command line for debugging and testing the ant game

// COMMAND LINE STATE
let commandLineActive = false;
let commandInput = "";
let commandHistory = [];
let commandHistoryIndex = -1;

// COMMAND LINE INPUT HANDLER
function handleCommandLineInput() {
  if (keyCode === ENTER) {
    // Execute command
    if (commandInput.trim() !== "") {
      executeCommand(commandInput.trim());
      commandHistory.unshift(commandInput.trim()); // Add to history
      if (commandHistory.length > 20) commandHistory.pop(); // Limit history
    }
    commandLineActive = false;
    commandInput = "";
    commandHistoryIndex = -1;
  } else if (keyCode === ESCAPE) {
    // Cancel command input
    commandLineActive = false;
    commandInput = "";
    commandHistoryIndex = -1;
    console.log("💻 Command line cancelled.");
  } else if (keyCode === BACKSPACE) {
    // Remove last character
    commandInput = commandInput.slice(0, -1);
  } else if (keyCode === UP_ARROW) {
    // Navigate command history up
    if (commandHistory.length > 0 && commandHistoryIndex < commandHistory.length - 1) {
      commandHistoryIndex++;
      commandInput = commandHistory[commandHistoryIndex];
    }
  } else if (keyCode === DOWN_ARROW) {
    // Navigate command history down
    if (commandHistoryIndex > 0) {
      commandHistoryIndex--;
      commandInput = commandHistory[commandHistoryIndex];
    } else if (commandHistoryIndex === 0) {
      commandHistoryIndex = -1;
      commandInput = "";
    }
  } else if (key && key.length === 1) {
    // Add typed character
    commandInput += key;
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
      console.clear();
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
  
  // Spawn ants using existing system
  const oldIndex = ant_Index;
  for (let i = 0; i < count; i++) {
    let sizeR = random(0, 15);
    let baseAnt = new ant(random(0, width-50), random(0, height-50), 20 + sizeR, 20 + sizeR, 30, 0);
    let speciesName = assignSpecies();
    ants[ant_Index - 1] = new AntWrapper(new Species(baseAnt, speciesName, speciesImages[speciesName]), speciesName);
    
    // Set faction if specified
    if (faction !== 'neutral') {
      const antObj = ants[ant_Index - 1].antObject ? ants[ant_Index - 1].antObject : ants[ant_Index - 1];
      if (antObj) {
        antObj.faction = faction;
      }
    }
  }
  console.log(`✅ Spawned ${count} ants. Total ants: ${ant_Index}`);
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
  
  selectedAnt.posX = x;
  selectedAnt.posY = y;
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
    
    // Command line box
    let boxHeight = 40;
    let boxY = height - boxHeight - 20;
    let boxX = 20;
    let boxWidth = width - 40;
    
    // Command line background
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
    
    // Help text
    fill(200, 200, 200, 180);
    noStroke();
    textAlign(LEFT);
    textSize(11);
    text("Type command and press Enter, or Escape to cancel. Up/Down for history.", boxX, boxY - 5);
    text("Type 'help' for available commands.", boxX, boxY - 18);
    
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