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

// DEV CONSOLE STATE (shared with testing.js)
let devConsoleEnabled = false;

// Console capture - overrides console.log to capture messages for the in-game console.
let originalConsoleLog = console.log;
console.log = function(...args) {
  originalConsoleLog.apply(console, args);
  if (commandLineActive) {
    let message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
    consoleOutput.unshift(message);
    if (consoleOutput.length > 100) consoleOutput.pop();
  }
};

/**
 * handleUIDebugCommand
 * --------------------
 * Handles UI Debug Manager commands from the command line.
 * @param {string[]} args - Command arguments: toggle, enable, disable, reset, list
 */
function handleUIDebugCommand(args) {
  if (typeof g_uiDebugManager === 'undefined' || !g_uiDebugManager) {
    console.log("❌ UI Debug Manager not available");
    return;
  }
  
  if (args.length === 0) {
    console.log(`🎯 UI Debug Manager Status: ${g_uiDebugManager.isActive ? 'ENABLED' : 'DISABLED'}`);
    console.log(`📊 Registered Elements: ${Object.keys(g_uiDebugManager.registeredElements).length}`);
    return;
  }
  
  const action = args[0].toLowerCase();
  switch (action) {
    case 'toggle':
      g_uiDebugManager.toggle();
      console.log(`🎯 UI Debug Manager: ${g_uiDebugManager.isActive ? 'ENABLED' : 'DISABLED'}`);
      break;
      
    case 'enable':
    case 'on':
      g_uiDebugManager.enable();
      console.log("🎯 UI Debug Manager ENABLED");
      break;
      
    case 'disable':
    case 'off':
      g_uiDebugManager.disable();
      console.log("🎯 UI Debug Manager DISABLED");
      break;
      
    case 'reset':
      if (g_uiDebugManager.resetAllPositions) {
        g_uiDebugManager.resetAllPositions();
        console.log("🔄 All UI elements reset to original positions");
      } else {
        console.log("❌ Reset function not available");
      }
      break;
      
    case 'list':
      const elements = g_uiDebugManager.registeredElements;
      const elementCount = Object.keys(elements).length;
      if (elementCount === 0) {
        console.log("📝 No UI elements registered yet");
      } else {
        console.log(`📝 Registered UI Elements (${elementCount}):`);
        Object.entries(elements).forEach(([id, element], index) => {
          const status = element.isDraggable ? '🖱️' : '🔒';
          const pos = `(${element.bounds.x}, ${element.bounds.y})`;
          console.log(`   ${index + 1}. ${status} ${element.label || id} - ${pos}`);
        });
      }
      break;
      
    case 'info':
      console.log("🎯 UI Debug Manager Information:");
      console.log(`   Status: ${g_uiDebugManager.isActive ? 'ENABLED' : 'DISABLED'}`);
      console.log(`   Elements: ${Object.keys(g_uiDebugManager.registeredElements).length}`);
      console.log(`   Debug Mode: Press ~ or \` to toggle`);
      console.log(`   Drag: Click yellow handles when debug mode is ON`);
      break;
      
    default:
      console.log("❌ Usage: ui <toggle|enable|disable|reset|list|info>");
      console.log("Examples:");
      console.log("  ui toggle    - Toggle debug mode on/off");
      console.log("  ui enable    - Enable UI debug mode");
      console.log("  ui list      - List all registered UI elements");
      console.log("  ui reset     - Reset all positions to original");
  }
}

/**
 * handleCommandLineInput
 * ----------------------
 * Processes keyboard input when the command line is active.
 * - Handles Enter/Escape/Backspace and history navigation (Up/Down).
 * - Supports Shift+arrows for scrolling via handleCommandLineScroll.
 * - Appends printable characters to commandInput.
 */
function handleCommandLineInput() {
  if (!commandLineActive) return;
  if (keyIsDown && keyIsDown(16)) { handleCommandLineScroll(); return; }
  if (keyCode === 13) { // ENTER
    if (commandInput.trim() !== "") {
      actualCommands.unshift(commandInput.trim());
      if (actualCommands.length > 50) actualCommands.pop();
      commandHistory.unshift(`> ${commandInput.trim()}`);
      consoleOutput.unshift(`> ${commandInput.trim()}`);
      executeCommand(commandInput.trim());
      if (commandHistory.length > 100) commandHistory.pop();
      if (consoleOutput.length > 100) consoleOutput.pop();
    }
    commandInput = ""; commandHistoryIndex = -1; scrollOffset = 0;
  } else if (keyCode === 27) { // ESCAPE
    commandLineActive = false; commandInput = ""; commandHistoryIndex = -1;
    console.log("💻 Command line cancelled.");
  } else if (keyIsDown(8)) { // BACKSPACE
    commandInput = commandInput.slice(0, -1);
  } else if (keyCode === 38) { // UP_ARROW
    if (actualCommands.length > 0 && commandHistoryIndex < actualCommands.length - 1) {
      commandHistoryIndex++; commandInput = actualCommands[commandHistoryIndex];
    }
  } else if (keyCode === 40) { // DOWN_ARROW
    if (commandHistoryIndex > 0) { commandHistoryIndex--; commandInput = actualCommands[commandHistoryIndex];
    } else if (commandHistoryIndex === 0) { commandHistoryIndex = -1; commandInput = ""; }
  } else if (key && key.length === 1) {
    commandInput += key;
  }
}

/**
 * handleCommandLineScroll
 * -----------------------
 * Scrolls the command line output pane when Shift is held.
 * - Uses Up/Down/PageUp/PageDown to adjust scrollOffset within bounds.
 */
function handleCommandLineScroll() {
  if (!commandLineActive) return;
  if (keyCode === 38) { scrollOffset = Math.min(scrollOffset + 1, Math.max(0, consoleOutput.length - 10)); }
  else if (keyCode === 40) { scrollOffset = Math.max(scrollOffset - 1, 0); }
  else if (keyCode === 33) { scrollOffset = Math.min(scrollOffset + 10, Math.max(0, consoleOutput.length - 10)); }
  else if (keyCode === 34) { scrollOffset = Math.max(scrollOffset - 10, 0); }
}

/**
 * executeCommand
 * --------------
 * Parse and execute a single command string entered in the debug console.
 * - Supports quoted args, normalizes command to lowercase, maps to handler functions.
 * @param {string} command - Raw command input from the command line UI.
 */
function executeCommand(command) {
  console.log(`💻 > ${command}`);
  const parts = command.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  const cmd = (parts[0] || '').toLowerCase();
  const args = parts.slice(1).map(s => s.replace(/^"|"$/g, ''));
  switch (cmd) {
    case 'help': showCommandHelp(); break;
    case 'spawn': handleSpawnCommand(args); break;
    case 'clear': consoleOutput = []; scrollOffset = 0; console.log("💻 Console cleared."); break;
    case 'debug': handleDebugCommand(args); break;
    case 'select': handleSelectCommand(args); break;
    case 'kill': handleKillCommand(args); break;
    case 'teleport':
    case 'tp': handleTeleportCommand(args); break;
    case 'info': showGameInfo(); break;
    case 'test': handleTestCommand(args); break;
    case 'perf': handlePerformanceCommand(args); break;
    case 'entity-perf': handleEntityPerformanceCommand(args); break;
    case 'ui': 
    case 'ui-debug': handleUIDebugCommand(args); break;
    default: console.log(`❌ Unknown command: ${cmd}. Type 'help' for available commands.`);
  }
}

/**
 * showCommandHelp
 * ---------------
 * Prints available commands and usage examples to the console output.
 */
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
  console.log("  perf [toggle|stats] - Control performance monitor");
  console.log("  entity-perf [report|reset] - Entity performance analysis");
  console.log("  ui <toggle|enable|disable|reset|list> - Control UI Debug Manager");
  console.log("Examples:");
  console.log("  spawn 10 ant blue");
  console.log("  teleport 100 200");
  console.log("  select all");
  console.log("  perf toggle");
  console.log("  entity-perf report");
}

/**
 * handleTestCommand
 * -----------------
 * Placeholder for test-related command handling.
 * @param {string[]} args - Command arguments.
 */
function handleTestCommand(args) { }

/**
 * handleSpawnCommand
 * ------------------
 * Spawns a number of entities via command line.
 * - args[0] = count (integer), args[1] = type, args[2] = faction.
 * - Ensures new ants are pushed to the end of the ants array and updates selection controller.
 */
function handleSpawnCommand(args) {
  const parsed = Number.parseInt(args[0], 10);
  const count = Number.isNaN(parsed) ? 1 : parsed;
  const type = args[1] || 'ant';
  const faction = args[2] || 'neutral';
  if (count < 1 || count > 5000) { console.log("❌ Spawn count must be between 1 and 5000"); return; }
  console.log(`🐜 Spawning ${count} ${type}(s) with faction: ${faction}`);
  const startingCount = antIndex;
  for (let i = 0; i < count; i++) {
    try {
      let sizeR = random(0, 15);
      let JobName = assignJob();
      
      // Create ant with new system
      let newAnt = new ant(random(0, width-50), random(0, height-50), 20 + sizeR, 20 + sizeR, 30, 0);
      newAnt.assignJob(JobName, JobImages[JobName]);
      
      // Set faction if specified
      if (faction !== 'neutral') {
        newAnt.faction = faction;
      }
      
      // Store ant directly
      ants.push(newAnt);
      
      if (!newAnt) { console.log(`❌ Failed to create ant ${i + 1}`); continue; }
    } catch (error) { console.log(`❌ Error creating ant ${i + 1}: ${error.message}`); }
  }
  const actualSpawned = ants.length - startingCount;
  console.log(`✅ Spawned ${actualSpawned} ants. Total ants: ${ants.length}`);
  if (typeof g_selectionBoxController !== 'undefined' && g_selectionBoxController) g_selectionBoxController.entities = ants;
}

/**
 * handleDebugCommand
 * ------------------
 * Toggle or query debug logging state.
 * @param {string[]} args - Command arguments, expects 'on' or 'off'.
 */
function handleDebugCommand(args) {
  if (args.length === 0) { console.log(`🛠️  Debug logging is currently: ${devConsoleEnabled ? 'ON' : 'OFF'}`); return; }
  switch (args[0].toLowerCase()) {
    case 'on':
    case 'true':
      devConsoleEnabled = true; console.log("🛠️  Debug logging enabled"); break;
    case 'off':
    case 'false':
      devConsoleEnabled = false; console.log("🛠️  Debug logging disabled"); break;
    default:
      console.log("❌ Use 'debug on' or 'debug off'");
  }
}

/**
 * handleSelectCommand
 * -------------------
 * Selects/deselects entities.
 * - 'all' selects every ant; 'none' deselects; numeric index selects that ant.
 * @param {string[]} args
 */
function handleSelectCommand(args){
  if(!args.length){ console.log("❌ Specify 'all','none', or an ant index"); return; }
  const target = args[0].toLowerCase();
  switch(target){
    case 'all': {
      let count = 0;
      for(let i=0;i<ants.length;i++){ const a = ants[i]?.antObject ?? ants[i]; if(a){ a.isSelected = true; count++; } }
      console.log(`✅ Selected ${count} ants`);
      break;
    }
    case 'none': {
      for(let i=0;i<ants.length;i++){ const a = ants[i]?.antObject ?? ants[i]; if(a) a.isSelected = false; }
      selectedAnt = null; console.log("✅ Deselected all ants");
      break;
    }
    default: {
      const index = Number.parseInt(target, 10);
      if(!Number.isInteger(index) || index < 0 || index >= ants.length || !ants[index]) { console.log(`❌ Invalid ant index: ${target}`); return; }
      for(let i=0;i<ants.length;i++){ const a = ants[i]?.antObject ?? ants[i]; if(a) a.isSelected = false; }
      const a = ants[index]?.antObject ?? ants[index];
      if(a){ a.isSelected = true; selectedAnt = a; console.log(`✅ Selected ant ${index}`); }
    }
  }
}

/**
 * handleKillCommand
 * -----------------
 * Removes ants based on command:
 * - 'all' clears the list, 'selected' removes selected ants, numeric index removes that ant.
 * @param {string[]} args
 */
function handleKillCommand(args) {
  if (!args.length) { console.log("❌ Specify 'all', 'selected', or an ant index"); return; }
  const target = args[0].toLowerCase();
  switch (target) {
    case 'all': {
      const count = antIndex;
      ants = []; antIndex = 0; selectedAnt = null;
      console.log(`💀 Removed all ${count} ants`);
      break;
    }
    case 'selected': {
      let count = 0;
      for (let i = ants.length - 1; i >= 0; i--) {
        const antObj = ants[i]?.antObject ?? ants[i];
        if (antObj && antObj.isSelected) { ants.splice(i, 1); count++; }
      }
      antIndex = ants.length; selectedAnt = null;
      console.log(`💀 Removed ${count} selected ants`);
      break;
    }
    default: {
      const index = Number.parseInt(target, 10);
      if (!Number.isInteger(index) || index < 0 || index >= ants.length || !ants[index]) {
        console.log(`❌ Invalid ant index: ${target}`); return;
      }
      ants.splice(index, 1); antIndex = ants.length; selectedAnt = null;
      console.log(`💀 Removed ant ${index}`);
    }
  }
}

/**
 * handleTeleportCommand
 * ---------------------
 * Moves the currently selected ant to provided coordinates.
 * Usage: teleport <x> <y>
 * @param {string[]} args
 */
function handleTeleportCommand(args) {
  if (args.length < 2) { console.log("❌ Usage: teleport <x> <y>"); return; }
  const x = parseInt(args[0], 10); const y = parseInt(args[1], 10);
  if (isNaN(x) || isNaN(y)) { console.log("❌ Coordinates must be numbers"); return; }
  if (!selectedAnt) { console.log("❌ No ant selected. Use 'select <index>' first."); return; }
  selectedAnt.setPosition(x, y); console.log(`🚀 Teleported selected ant to (${x}, ${y})`);
}

/**
 * showGameInfo
 * ------------
 * Prints summary information about the current game state.
 */
function showGameInfo() {
  console.log("🎮 Game State Information:");
  console.log(`  Total Ants: ${antIndex}`);
  console.log(`  Canvas Size: ${width} x ${height}`);
  console.log(`  Dev Console: ${devConsoleEnabled ? 'ON' : 'OFF'}`);
  console.log(`  Selected Ant: ${selectedAnt ? 'Yes' : 'None'}`);
  const factions = {};
  for (let i = 0; i < antIndex; i++) if (ants[i]) { const antObj = ants[i].antObject ? ants[i].antObject : ants[i]; if (antObj && antObj.faction) factions[antObj.faction] = (factions[antObj.faction] || 0) + 1; }
  if (Object.keys(factions).length > 0) { console.log("  Factions:"); for (const [faction, count] of Object.entries(factions)) console.log(`    ${faction}: ${count} ants`); }
}

/**
 * drawCommandLine
 * ---------------
 * Renders the command line UI overlay when the developer console is enabled.
 * - Shows input box, blinking cursor, help text and scrollable console output.
 */
function drawCommandLine() {
  if (!(commandLineActive && devConsoleEnabled)) return;
  push();
  fill(0,0,0,120); noStroke(); rect(0,0,width,height);
  let boxHeight=40, historyHeight=200, boxY=20, boxX=20, boxWidth=width-40;
  fill(50,50,50,220); stroke(100); strokeWeight(2); rect(boxX,boxY,boxWidth,boxHeight,5);
  fill(0,255,0); noStroke(); textAlign(LEFT,CENTER); textSize(16); text(">", boxX+10, boxY+boxHeight/2);
  fill(255); textAlign(LEFT,CENTER); textSize(14); let textX=boxX+30; text(commandInput, textX, boxY+boxHeight/2);
  if (frameCount % 60 < 30) { let cursorX = textX + textWidth(commandInput); stroke(255); strokeWeight(2); line(cursorX, boxY+8, cursorX, boxY+boxHeight-8); }
  fill(200,200,200,180); noStroke(); textAlign(LEFT); textSize(11); let helpY=boxY+boxHeight+5;
  text("Type command and press Enter, or Escape to cancel. Up/Down for command history.", boxX, helpY);
  text("Hold Shift + Up/Down/PageUp/PageDown to scroll output. Type 'help' for available commands.", boxX, helpY+15);
  let outputY = boxY + boxHeight + 35; fill(30,30,30,200); stroke(80); strokeWeight(1); rect(boxX, outputY, boxWidth, historyHeight, 5);
  fill(180); noStroke(); textAlign(LEFT,TOP); let lineHeight=14, startY=outputY+10, maxLines=Math.floor((historyHeight-20)/lineHeight);
  fill(220); textSize(11); let scrollInfo = scrollOffset>0?` (scrolled +${scrollOffset})`:""; text(`Console Output${scrollInfo}:`, boxX+10, startY); startY+=20;
  fill(160); textSize(9);
  let outputToShow = consoleOutput.slice(scrollOffset, scrollOffset+maxLines);
  for (let i=0;i<outputToShow.length;i++){
    let outputLineY = startY + (i*lineHeight);
    if (outputLineY < outputY + historyHeight - 10) {
      let line = outputToShow[i];
      if (line.startsWith('> ')) fill(100,255,100); else if (line.includes('❌')) fill(255,100,100); else if (line.includes('✅')) fill(100,255,100); else if (line.includes('🛠️')||line.includes('💻')) fill(255,255,100); else fill(200);
      let maxWidth = boxWidth - 30;
      if (textWidth(line) > maxWidth) {
        let words = line.split(' '); let currentLine = '';
        for (let word of words) {
          if (textWidth(currentLine + word + ' ') > maxWidth) { text(currentLine, boxX + 15, outputLineY); outputLineY += lineHeight; currentLine = word + ' '; }
          else currentLine += word + ' ';
        }
        if (currentLine.trim()) text(currentLine, boxX + 15, outputLineY);
      } else text(line, boxX + 15, outputLineY);
    }
  }
  if (consoleOutput.length === 0) { fill(120); textAlign(CENTER,CENTER); text("No console output yet. Try typing 'help'", boxX + boxWidth/2, outputY + historyHeight/2); }
  if (consoleOutput.length > maxLines) { fill(255,255,100,150); textAlign(RIGHT); textSize(9); text(`${scrollOffset + outputToShow.length}/${consoleOutput.length} lines`, boxX + boxWidth - 10, outputY + historyHeight - 5); }
  pop();
}

/**
 * openCommandLine
 * ---------------
 * Activates the command line UI if dev console is enabled.
 * @returns {boolean} true when opened.
 */
function openCommandLine() { if (devConsoleEnabled && !commandLineActive) { commandLineActive = true; commandInput = ""; console.log("💻 Command line activated. Type 'help' for available commands."); return true; } return false; }

/** closeCommandLine - Deactivate command line and reset input. */
function closeCommandLine() { commandLineActive = false; commandInput = ""; commandHistoryIndex = -1; }

/** isCommandLineActive - Returns true if the command line UI is active. */
function isCommandLineActive() { return commandLineActive; }

// Debug: Ensure the function is available globally
if (typeof window !== 'undefined') {
  window.isCommandLineActive = isCommandLineActive;
}

// Debug: Log that the file loaded successfully
console.log('✅ commandLine.js loaded successfully, isCommandLineActive function available');

/**
 * handlePerformanceCommand
 * -------------------------
 * Handle performance monitor commands.
 * @param {string[]} args - Command arguments ['toggle'|'stats']
 */
function handlePerformanceCommand(args) {
  if (typeof g_performanceMonitor === 'undefined' || !g_performanceMonitor) {
    console.log("❌ Performance monitor not available");
    return;
  }

  const action = args[0] || 'stats';
  
  switch (action.toLowerCase()) {
    case 'toggle':
      const currentState = g_performanceMonitor.debugDisplay && g_performanceMonitor.debugDisplay.enabled;
      g_performanceMonitor.setDebugDisplay(!currentState);
      console.log(`🔍 Performance monitor ${!currentState ? 'ENABLED' : 'DISABLED'}`);
      break;
      
    case 'stats':
      const stats = g_performanceMonitor.getFrameStats();
      console.log("📊 Performance Statistics:");
      console.log(`   FPS: ${stats.fps} (avg: ${stats.avgFPS}, min: ${stats.minFPS})`);
      console.log(`   Frame Time: ${stats.frameTime}ms (avg: ${stats.avgFrameTime}ms)`);
      console.log(`   Performance Level: ${stats.performanceLevel}`);
      console.log(`   Entities: ${stats.entityStats.totalEntities} total, ${stats.entityStats.renderedEntities} rendered`);
      if (stats.entityPerformance) {
        console.log(`   Entity Render Time: ${stats.entityPerformance.totalEntityRenderTime.toFixed(2)}ms`);
        console.log(`   Entity Efficiency: ${stats.entityPerformance.entityRenderEfficiency.toFixed(1)}%`);
      }
      break;
      
    default:
      console.log("❌ Usage: perf [toggle|stats]");
  }
}

/**
 * handleEntityPerformanceCommand
 * -------------------------------
 * Handle detailed entity performance analysis commands.
 * @param {string[]} args - Command arguments ['report'|'reset'|'slowest']
 */
function handleEntityPerformanceCommand(args) {
  if (typeof g_performanceMonitor === 'undefined' || !g_performanceMonitor) {
    console.log("❌ Performance monitor not available");
    return;
  }

  const action = args[0] || 'report';
  
  switch (action.toLowerCase()) {
    case 'report':
      const report = g_performanceMonitor.getEntityPerformanceReport();
      console.log("🎯 Entity Performance Report:");
      console.log(`   Total Render Time: ${report.totalRenderTime.toFixed(2)}ms`);
      console.log(`   Average per Entity: ${report.averageRenderTime.toFixed(2)}ms`);
      console.log(`   Render Efficiency: ${report.renderEfficiency.toFixed(1)}%`);
      
      if (report.typePerformance.length > 0) {
        console.log("\n📋 Entity Types (by performance):");
        report.typePerformance.forEach(type => {
          console.log(`   ${type.type}: ${type.currentAverage.toFixed(2)}ms avg (${type.count}x) - ${type.efficiency.toFixed(0)} entities/sec`);
        });
      }
      
      if (report.slowestEntities.length > 0) {
        console.log("\n⚠️  Slowest Entities:");
        report.slowestEntities.slice(0, 5).forEach((entity, i) => {
          console.log(`   ${i + 1}. ${entity.type} (${entity.id}): ${entity.renderTime.toFixed(2)}ms`);
        });
      }
      
      if (report.phaseBreakdown.length > 0) {
        console.log("\n⏱️  Render Phases:");
        report.phaseBreakdown.forEach(phase => {
          if (phase.time > 0) {
            console.log(`   ${phase.phase}: ${phase.time.toFixed(2)}ms (${phase.percentage.toFixed(1)}%)`);
          }
        });
      }
      break;
      
    case 'reset':
      // Reset performance tracking data
      g_performanceMonitor.entityPerformance.slowestEntities = [];
      g_performanceMonitor.entityPerformance.typeHistory.clear();
      g_performanceMonitor.entityPerformance.typeAverages.clear();
      console.log("🔄 Entity performance data reset");
      break;
      
    case 'slowest':
      const slowest = g_performanceMonitor.entityPerformance.slowestEntities.slice(0, 10);
      if (slowest.length > 0) {
        console.log("🐌 Top 10 Slowest Entities:");
        slowest.forEach((entity, i) => {
          console.log(`   ${i + 1}. ${entity.type} (${entity.id}): ${entity.renderTime.toFixed(2)}ms (frame ${entity.frame})`);
        });
      } else {
        console.log("📊 No entity performance data available yet");
      }
      break;
      
    default:
      console.log("❌ Usage: entity-perf [report|reset|slowest]");
  }
}