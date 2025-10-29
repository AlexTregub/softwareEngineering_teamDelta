/**
 * EventDebugManager - Developer toolset for Random Events System
 * 
 * Provides 6 core debug features:
 * 1. Visual event flag overlay (color-coded by type)
 * 2. Level-specific event information display
 * 3. Triggered event history tracking
 * 4. Manual event triggering (bypass restrictions)
 * 5. Global event list with trigger commands
 * 6. Console command integration
 * 
 * @class EventDebugManager
 */
class EventDebugManager {
  constructor() {
    this.enabled = false;
    this.showEventFlags = false;
    this.showEventList = false;
    this.showLevelInfo = false;
    
    // Track triggered events per level
    this.triggeredEventsPerLevel = {};
    
    // Color scheme for event types
    this.eventTypeColors = {
      'dialogue': [100, 150, 255, 150],    // Blue
      'spawn': [255, 100, 100, 150],       // Red
      'tutorial': [100, 255, 150, 150],    // Green
      'boss': [200, 100, 255, 150],        // Purple
      'default': [150, 150, 150, 150]      // Grey
    };
  }
  
  /**
   * Get singleton instance
   * @static
   * @returns {EventDebugManager} - Singleton instance
   */
  static getInstance() {
    if (!EventDebugManager._instance) {
      EventDebugManager._instance = new EventDebugManager();
    }
    return EventDebugManager._instance;
  }
  
  /**
   * Reset singleton instance (for testing)
   * @static
   */
  static resetInstance() {
    EventDebugManager._instance = null;
    
    logNormal('EventDebugManager initialized');
  }
  
  // ============================================================
  // FEATURE 1: Enable/Disable Control
  // ============================================================
  
  enable() {
    this.enabled = true;
  }
  
  disable() {
    this.enabled = false;
  }
  
  toggle() {
    this.enabled = !this.enabled;
  }
  
  // ============================================================
  // FEATURE 2: Event Flag Visualization (Color-Coded)
  // ============================================================
  
  toggleEventFlags() {
    this.showEventFlags = !this.showEventFlags;
  }
  
  showEventFlagsOverlay(visible) {
    this.showEventFlags = visible;
  }
  
  getEventTypeColor(eventType) {
    return this.eventTypeColors[eventType] || this.eventTypeColors['default'];
  }
  
  renderEventFlags() {
    if (!this.enabled || !this.showEventFlags) return;
    
    // Get event flags from level editor
    const flags = this.getEventFlagsInEditor();
    if (flags.length === 0) return;
    
    const levelId = this.getCurrentLevelId();
    
    push();
    
    flags.forEach(flag => {
      // Get event for this flag
      const event = window.eventManager?.getEvent(flag.eventId);
      if (!event) return;
      
      // Get color for event type
      const color = this.getEventTypeColor(event.type);
      
      // Check if should grey out (triggered one-time event)
      const shouldGrey = this.shouldGreyOutEvent(flag.eventId, levelId);
      
      // Set color with appropriate opacity
      if (shouldGrey) {
        fill(color[0], color[1], color[2], 80); // Greyed
        stroke(color[0], color[1], color[2], 120);
      } else {
        fill(color[0], color[1], color[2], color[3]); // Normal
        stroke(color[0], color[1], color[2], 255);
      }
      
      strokeWeight(2);
      circle(flag.x, flag.y, flag.radius * 2);
      
      // Label
      fill(255);
      noStroke();
      textAlign(CENTER);
      textSize(12);
      text(flag.eventId, flag.x, flag.y - flag.radius - 10);
      
      // Type indicator
      textSize(10);
      fill(color[0], color[1], color[2], 255);
      text(`(${event.type})`, flag.x, flag.y - flag.radius - 25);
    });
    
    pop();
  }
  
  // ============================================================
  // FEATURE 3: Level Event Information
  // ============================================================
  
  toggleLevelInfo() {
    this.showLevelInfo = !this.showLevelInfo;
  }
  
  showLevelEventInfo(visible) {
    this.showLevelInfo = visible;
  }
  
  getEventsForLevel(levelId) {
    const eventMgr = (typeof window !== 'undefined' && window.eventManager) || 
                     (typeof global !== 'undefined' && global.eventManager);
    
    if (!eventMgr) return [];
    
    const allEvents = eventMgr.getAllEvents();
    return allEvents.filter(event => event.levelId === levelId);
  }
  
  getTriggersForLevel(levelId) {
    const eventMgr = (typeof window !== 'undefined' && window.eventManager) || 
                     (typeof global !== 'undefined' && global.eventManager);
    
    if (!eventMgr) return [];
    
    const levelEvents = this.getEventsForLevel(levelId);
    const triggers = [];
    
    levelEvents.forEach(event => {
      const eventTriggers = eventMgr.triggers;
      if (eventTriggers) {
        eventTriggers.forEach((trigger, key) => {
          if (trigger.eventId === event.id) {
            triggers.push(trigger);
          }
        });
      }
    });
    
    return triggers;
  }
  
  renderLevelInfo() {
    if (!this.enabled || !this.showLevelInfo) return;
    
    const levelId = this.getCurrentLevelId();
    if (!levelId) return;
    
    const events = this.getEventsForLevel(levelId);
    const triggers = this.getTriggersForLevel(levelId);
    
    push();
    
    // Panel background
    fill(0, 0, 0, 200);
    stroke(100, 150, 255, 255);
    strokeWeight(2);
    rect(10, 100, 400, Math.min(600, events.length * 60 + 80));
    
    // Header
    fill(100, 150, 255);
    noStroke();
    textAlign(LEFT);
    textSize(16);
    text(`Level Events: ${levelId}`, 20, 125);
    
    // Event list
    let yOffset = 160;
    textSize(12);
    
    events.forEach((event, index) => {
      const isTriggered = this.hasEventBeenTriggered(event.id, levelId);
      const trigger = triggers.find(t => t.eventId === event.id);
      
      // Event status color
      if (isTriggered) {
        fill(100, 255, 100); // Green for triggered
      } else {
        fill(255, 255, 255); // White for ready
      }
      
      // Event ID and type
      text(`${isTriggered ? '✓' : '○'} ${event.id} (${event.type})`, 20, yOffset);
      
      // Priority and trigger info
      fill(150, 150, 150);
      textSize(10);
      text(`P:${event.priority || 5} | Trigger: ${trigger ? trigger.type : 'none'}`, 30, yOffset + 15);
      
      yOffset += 50;
    });
    
    pop();
  }
  
  // ============================================================
  // FEATURE 4: Triggered Events Tracking
  // ============================================================
  
  onEventTriggered(eventId, levelId) {
    if (!this.triggeredEventsPerLevel[levelId]) {
      this.triggeredEventsPerLevel[levelId] = [];
    }
    
    if (!this.triggeredEventsPerLevel[levelId].includes(eventId)) {
      this.triggeredEventsPerLevel[levelId].push(eventId);
    }
  }
  
  getTriggeredEvents(levelId) {
    return this.triggeredEventsPerLevel[levelId] || [];
  }
  
  hasEventBeenTriggered(eventId, levelId) {
    const triggered = this.triggeredEventsPerLevel[levelId] || [];
    return triggered.includes(eventId);
  }
  
  clearTriggeredEvents(levelId) {
    this.triggeredEventsPerLevel[levelId] = [];
  }
  
  isEventOneTime(eventId) {
    const eventMgr = (typeof window !== 'undefined' && window.eventManager) || 
                     (typeof global !== 'undefined' && global.eventManager);
    
    if (!eventMgr) return false;
    
    // Check if any trigger for this event is marked as oneTime
    const triggers = eventMgr.triggers;
    if (!triggers) return false;
    
    let isOneTime = false;
    triggers.forEach(trigger => {
      if (trigger.eventId === eventId && trigger.oneTime === true) {
        isOneTime = true;
      }
    });
    
    return isOneTime;
  }
  
  shouldGreyOutEvent(eventId, levelId) {
    return this.isEventOneTime(eventId) && this.hasEventBeenTriggered(eventId, levelId);
  }
  
  // ============================================================
  // FEATURE 5: Manual Event Triggering (Bypass Restrictions)
  // ============================================================
  
  manualTriggerEvent(eventId, customData = {}) {
    const eventMgr = (typeof window !== 'undefined' && window.eventManager) || 
                     (typeof global !== 'undefined' && global.eventManager);
    
    if (!eventMgr) {
      console.error('EventManager not initialized');
      return false;
    }
    
    const event = eventMgr.getEvent(eventId);
    if (!event) {
      console.error(`Event ${eventId} not found`);
      return false;
    }
    
    // Mark as debug triggered to bypass restrictions
    const data = { ...customData, debugTriggered: true };
    
    // Trigger the event
    eventMgr.triggerEvent(eventId, data);
    
    // Track in debug history
    const levelId = this.getCurrentLevelId() || 'manual';
    this.onEventTriggered(eventId, levelId);
    
    logNormal(`Debug: Manually triggered event ${eventId}`);
    return true;
  }
  
  // ============================================================
  // FEATURE 6: Event List Display
  // ============================================================
  
  toggleEventList() {
    this.showEventList = !this.showEventList;
  }
  
  showEventListPanel(visible) {
    this.showEventList = visible;
  }
  
  getAllEventCommands() {
    const eventMgr = (typeof window !== 'undefined' && window.eventManager) || 
                     (typeof global !== 'undefined' && global.eventManager);
    
    if (!eventMgr) return [];
    
    const allEvents = eventMgr.getAllEvents();
    return allEvents.map(event => ({
      id: event.id,
      type: event.type,
      priority: event.priority || 5,
      levelId: event.levelId,
      command: this.getEventCommand(event.id)
    }));
  }
  
  getEventCommand(eventId) {
    return `triggerEvent ${eventId}`;
  }
  
  renderEventList() {
    if (!this.enabled || !this.showEventList) return;
    
    const events = this.getAllEventCommands();
    if (events.length === 0) return;
    
    push();
    
    // Panel background
    fill(0, 0, 0, 200);
    stroke(100, 150, 255, 255);
    strokeWeight(2);
    rect(window.width - 420, 10, 410, Math.min(700, events.length * 50 + 80));
    
    // Header
    fill(100, 150, 255);
    noStroke();
    textAlign(LEFT);
    textSize(16);
    text('All Events (Click to Trigger)', window.width - 410, 35);
    
    // Event list
    let yOffset = 70;
    textSize(12);
    
    events.forEach((event, index) => {
      // Event color based on type
      const color = this.getEventTypeColor(event.type);
      fill(color[0], color[1], color[2], 255);
      
      // Event ID and type
      text(`${event.id} (${event.type})`, window.width - 410, yOffset);
      
      // Command
      fill(150, 150, 150);
      textSize(10);
      text(event.command, window.width - 410, yOffset + 15);
      
      yOffset += 45;
    });
    
    pop();
  }
  
  // ============================================================
  // FEATURE 7: Command Integration
  // ============================================================
  
  getDebugCommands() {
    return {
      showEventFlags: () => this.toggleEventFlags(),
      showEventList: () => this.toggleEventList(),
      showLevelInfo: () => this.toggleLevelInfo(),
      triggerEvent: (eventId) => this.manualTriggerEvent(eventId),
      listEvents: () => this.listAllEvents()
    };
  }
  
  executeCommand(commandName, args = []) {
    const commands = this.getDebugCommands();
    
    if (commands[commandName]) {
      if (args.length > 0) {
        commands[commandName](args[0]);
      } else {
        commands[commandName]();
      }
      return true;
    }
    
    return false;
  }
  
  listAllEvents() {
    const events = this.getAllEventCommands();
    if (events.length === 0) {
      logNormal('No events found');
      return;
    }
    
    logNormal('All Events:');
    events.forEach(e => {
      logNormal(`  ${e.id} (${e.type}) - ${e.command}`);
    });
  }
  
  // ============================================================
  // Integration Helpers
  // ============================================================
  
  getCurrentLevelId() {
    // Check window first (browser), then global (Node.js tests)
    const mapMgr = (typeof window !== 'undefined' && window.mapManager) || 
                   (typeof global !== 'undefined' && global.mapManager);
    return mapMgr?.getActiveMapId() || null;
  }
  
  getAllLevelIds() {
    const mapMgr = (typeof window !== 'undefined' && window.mapManager) || 
                   (typeof global !== 'undefined' && global.mapManager);
    return mapMgr?.getAllMapIds() || [];
  }
  
  isLevelEditorActive() {
    const gameState = (typeof window !== 'undefined' && window.GameState) || 
                      (typeof global !== 'undefined' && global.GameState);
    return gameState?.current === 'LEVEL_EDITOR';
  }
  
  getEventFlagsInEditor() {
    const editor = (typeof window !== 'undefined' && window.levelEditor) || 
                   (typeof global !== 'undefined' && global.levelEditor);
    
    if (!editor?.eventLayer) {
      return [];
    }
    
    return editor.eventLayer.flags || [];
  }
}

// Global export
if (typeof window !== 'undefined') {
  window.EventDebugManager = EventDebugManager;
}

if (typeof module !== 'undefined') {
  module.exports = EventDebugManager;
}
