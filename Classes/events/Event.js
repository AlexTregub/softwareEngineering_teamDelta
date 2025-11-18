// /**
//  * Event Classes - Base class and specific event types
//  * 
//  * Events are triggered by EventTriggers and execute specific game actions.
//  * Each event type handles different gameplay scenarios (dialogue, spawning, tutorials, bosses).
//  * 
//  * Following TDD: Implementation written to pass existing unit tests.
//  * 
//  * @class GameEvent - Base class for all game events
//  * @class DialogueEvent - Display dialogue/messages to player
//  * @class SpawnEvent - Spawn enemies/entities at specified locations
//  * @class TutorialEvent - Interactive step-by-step tutorials
//  * @class BossEvent - Boss fight encounters with phases
//  */

// /**
//  * GameEvent - Base class for all game events
//  */
// class GameEvent {
//   /**
//    * Create a new event
//    * @param {Object} config - Event configuration
//    * @param {string} config.id - Unique event ID
//    * @param {string} config.type - Event type (dialogue, spawn, tutorial, boss)
//    * @param {Object} config.content - Event-specific content data
//    * @param {number} [config.priority=999] - Event priority (lower = higher priority)
//    * @param {Object} [config.metadata] - Optional metadata
//    * @param {Function} [config.onTrigger] - Callback when event triggers
//    * @param {Function} [config.onComplete] - Callback when event completes
//    * @param {Function} [config.onUpdate] - Callback during event update
//    * @param {number} [config.duration] - Auto-complete after duration (ms)
//    * @param {Function} [config.completionCondition] - Auto-complete when condition met
//    */
//   constructor(config) {
//     this.id = config.id;
//     this.type = config.type;
//     this.content = config.content || {};
//     this.priority = config.priority !== undefined ? config.priority : 999;
//     this.metadata = config.metadata;
    
//     // State tracking
//     this.active = false;
//     this.completed = false;
//     this.paused = false;
//     this.triggeredAt = null;
//     this.completedAt = null;
//     this._pauseStartTime = null;
//     this._totalPausedTime = 0;
    
//     // Callbacks
//     this.onTrigger = config.onTrigger;
//     this.onComplete = config.onComplete;
//     this.onUpdate = config.onUpdate;
    
//     // Auto-completion strategies
//     this.duration = config.duration;
//     this.autoCompleteAfter = config.autoCompleteAfter; // Alternative duration name
//     this.completionCondition = config.completionCondition;
//     this.completeWhen = config.completeWhen; // Alternative condition name
//     this.customCompletion = config.customCompletion;
//   }
  
//   /**
//    * Trigger the event (start execution)
//    * @param {*} data - Optional data to pass to onTrigger callback
//    */
//   trigger(data) {
//     this.active = true;
//     this.triggeredAt = typeof millis === 'function' ? millis() : Date.now();
    
//     if (this.onTrigger) {
//       this.onTrigger(data);
//     }
//   }
  
//   /**
//    * Complete the event
//    * @returns {boolean} - True if completed, false if not active
//    */
//   complete() {
//     if (!this.active) {
//       return false;
//     }
    
//     this.completed = true;
//     this.active = false;
//     this.completedAt = typeof millis === 'function' ? millis() : Date.now();
    
//     if (this.onComplete) {
//       this.onComplete();
//     }
    
//     return true;
//   }
  
//   /**
//    * Pause the event
//    */
//   pause() {
//     if (this.active && !this.paused) {
//       this.paused = true;
//       this._pauseStartTime = typeof millis === 'function' ? millis() : Date.now();
//     }
//   }
  
//   /**
//    * Resume the event from pause
//    */
//   resume() {
//     if (this.paused) {
//       const currentTime = typeof millis === 'function' ? millis() : Date.now();
//       this._totalPausedTime += (currentTime - this._pauseStartTime);
//       this.paused = false;
//       this._pauseStartTime = null;
//     }
//   }
  
//   /**
//    * Update event (called each frame)
//    * Handles auto-completion strategies
//    */
//   update() {
//     if (!this.active || this.paused) {
//       return;
//     }
    
//     // Execute onUpdate callback
//     if (this.onUpdate) {
//       this.onUpdate();
//     }
    
//     // Check auto-completion strategies
//     this._checkAutoCompletion();
//   }
  
//   /**
//    * Check auto-completion strategies
//    * @private
//    */
//   _checkAutoCompletion() {
//     // Duration-based auto-completion
//     const durationMs = this.duration || this.autoCompleteAfter;
//     if (durationMs !== undefined) {
//       const elapsed = this.getElapsedTime();
//       if (elapsed >= durationMs) {
//         this.complete();
//         return;
//       }
//     }
    
//     // Condition-based auto-completion (custom function)
//     if (this.completionCondition && typeof this.completionCondition === 'function') {
//       if (this.completionCondition()) {
//         this.complete();
//         return;
//       }
//     }
    
//     // Condition-based auto-completion (completeWhen object)
//     if (this.completeWhen) {
//       if (this._evaluateCompleteWhenCondition(this.completeWhen)) {
//         this.complete();
//         return;
//       }
//     }
    
//     // Custom completion callback
//     if (this.customCompletion && typeof this.customCompletion === 'function') {
//       if (this.customCompletion()) {
//         this.complete();
//         return;
//       }
//     }
//   }
  
//   /**
//    * Evaluate completeWhen condition object
//    * @private
//    */
//   _evaluateCompleteWhenCondition(condition) {
//     // Custom function condition
//     if (condition.type === 'custom') {
//       if (typeof condition.condition === 'function') {
//         return condition.condition();
//       }
//       return false;
//     }
    
//     // Flag-based condition
//     if (condition.type === 'flag') {
//       const eventManager = (typeof global !== 'undefined' && global.eventManager) ||
//                           (typeof window !== 'undefined' && window.eventManager);
      
//       if (!eventManager || !eventManager.getFlag) {
//         return false;
//       }
      
//       const flagValue = eventManager.getFlag(condition.flag);
      
//       // Apply operator
//       switch (condition.operator) {
//         case '<=':
//           return flagValue <= condition.value;
//         case '>=':
//           return flagValue >= condition.value;
//         case '<':
//           return flagValue < condition.value;
//         case '>':
//           return flagValue > condition.value;
//         case '!=':
//         case '!==':
//           return flagValue !== condition.value;
//         case '==':
//         case '===':
//         default:
//           return flagValue === condition.value;
//       }
//     }
    
//     return false;
//   }
  
//   /**
//    * Get elapsed time since trigger (excluding paused time)
//    * @returns {number} - Elapsed time in milliseconds
//    */
//   getElapsedTime() {
//     if (!this.triggeredAt) {
//       return 0;
//     }
    
//     const currentTime = typeof millis === 'function' ? millis() : Date.now();
//     const pausedTime = this.paused ? 
//       (currentTime - this._pauseStartTime + this._totalPausedTime) :
//       this._totalPausedTime;
    
//     return currentTime - this.triggeredAt - pausedTime;
//   }
  
//   /**
//    * Serialize event for JSON export
//    * @returns {Object} - JSON-serializable event data
//    */
//   toJSON() {
//     return {
//       id: this.id,
//       type: this.type,
//       content: this.content,
//       priority: this.priority,
//       metadata: this.metadata
//     };
//   }
// }

// /**
//  * DialogueEvent - Display dialogue/messages to player
//  * 
//  * Shows interactive dialogue panels with speaker names, messages, and choice buttons.
//  * Integrates with DraggablePanelManager for UI and EventManager for choice tracking.
//  * 
//  * Features:
//  * - Speaker names and messages
//  * - Multiple choice buttons
//  * - Branching dialogues via nextEventId
//  * - Choice tracking with event flags
//  * - Word-wrapped text rendering
//  * - Auto-continue support
//  * - Portrait support (future)
//  */
// class DialogueEvent extends GameEvent {
//   /**
//    * Create a new dialogue event
//    * @param {Object} config - Event configuration
//    * @param {string} config.id - Unique event identifier
//    * @param {Object} config.content - Dialogue content
//    * @param {string} [config.content.speaker='Dialogue'] - Speaker name
//    * @param {string} config.content.message - Dialogue message text (required)
//    * @param {Array} [config.content.choices] - Array of choice objects (defaults to "Continue")
//    * @param {string} [config.content.portrait] - Optional portrait image path
//    * @param {boolean} [config.content.autoContinue] - Auto-close dialogue
//    * @param {number} [config.content.autoContinueDelay=0] - Delay before auto-close (ms)
//    */
//   constructor(config) {
//     super({ ...config, type: 'dialogue' });
    
//     // Validate message is not empty
//     if (!config.content || !config.content.message || config.content.message.trim() === '') {
//       throw new Error('DialogueEvent requires a non-empty message');
//     }
    
//     // Set default speaker if not provided
//     if (!this.content.speaker) {
//       this.content.speaker = 'Dialogue';
//     }
    
//     // Create default "Continue" choice if no choices provided
//     if (!this.content.choices || this.content.choices.length === 0) {
//       this.content.choices = [{ text: 'Continue' }];
//     }
    
//     // Store reference to dialogue panel (created on trigger)
//     this._panel = null;
//     this._response = null;
//     this.onResponse = config.onResponse;
//     this.autoCompleteOnResponse = config.autoCompleteOnResponse;
//   }
  
//   /**
//    * Get array of choices (can be filtered in future)
//    * @returns {Array} Array of choice objects
//    */
//   getChoices() {
//     return this.content.choices || [];
//   }
  
//   /**
//    * Trigger the dialogue event
//    * Shows the dialogue panel with choices
//    * @param {*} data - Optional data to pass to parent trigger
//    */
//   trigger(data) {
//     // Call parent trigger
//     super.trigger(data);
    
//     // Check if draggablePanelManager exists
//     const panelManager = (typeof global !== 'undefined' && global.draggablePanelManager) ||
//                         (typeof window !== 'undefined' && window.draggablePanelManager);
    
//     if (!panelManager) {
//       console.warn('DialogueEvent: draggablePanelManager not available');
//       return;
//     }
    
//     // Get window dimensions (with fallbacks for testing)
//     const winWidth = (typeof window !== 'undefined' && window.innerWidth) || 1920;
//     const winHeight = (typeof window !== 'undefined' && window.innerHeight) || 1080;
    
//     // Create panel configuration
//     const panelConfig = {
//       id: 'dialogue-display',
//       title: this.content.speaker,
//       position: {
//         x: (winWidth / 2) - 250,
//         y: winHeight - 200
//       },
//       size: {
//         width: 500,
//         height: 160
//       },
//       behavior: {
//         draggable: false,
//         closeable: false,
//         minimizable: false
//       },
//       buttons: {
//         layout: 'horizontal',
//         autoSizeToContent: true,
//         spacing: 10,
//         items: this._generateChoiceButtons()
//       }
//     };
    
//     // Get or create panel (update if exists to handle dialogue changes)
//     this._panel = panelManager.getOrCreatePanel('dialogue-display', panelConfig, true);
    
//     // Set contentSizeCallback for custom rendering
//     if (this._panel && this._panel.config) {
//       this._panel.config.contentSizeCallback = (contentArea) => {
//         return this.renderDialogueContent(contentArea);
//       };
//     }
    
//     // Show the panel
//     if (this._panel && this._panel.show) {
//       this._panel.show();
//     }
//   }
  
//   /**
//    * Generate button configurations from choices
//    * @private
//    * @returns {Array} Array of button configs
//    */
//   _generateChoiceButtons() {
//     return this.getChoices().map((choice, index) => ({
//       caption: choice.text,
//       onClick: () => this.handleChoice(choice, index)
//     }));
//   }
  
//   /**
//    * Handle player choice selection
//    * @param {Object} choice - The selected choice object
//    * @param {number} index - Index of the choice
//    */
//   handleChoice(choice, index) {
//     // Execute choice callback if exists
//     if (choice.onSelect && typeof choice.onSelect === 'function') {
//       choice.onSelect(choice);
//     }
    
//     // Set event flag for choice tracking
//     const eventManager = (typeof global !== 'undefined' && global.eventManager) ||
//                         (typeof window !== 'undefined' && window.eventManager);
    
//     if (eventManager && eventManager.setFlag) {
//       eventManager.setFlag(`${this.id}_choice`, index);
//     }
    
//     // Trigger next event if specified
//     if (choice.nextEventId && eventManager && eventManager.triggerEvent) {
//       eventManager.triggerEvent(choice.nextEventId);
//     }
    
//     // Hide the panel
//     const panelManager = (typeof global !== 'undefined' && global.draggablePanelManager) ||
//                         (typeof window !== 'undefined' && window.draggablePanelManager);
    
//     if (panelManager && panelManager.hidePanel) {
//       panelManager.hidePanel('dialogue-display');
//     }
    
//     // Store response
//     this._response = choice.text;
    
//     // Execute onResponse callback if exists
//     if (this.onResponse && typeof this.onResponse === 'function') {
//       this.onResponse(choice.text);
//     }
    
//     // Complete this dialogue event
//     this.complete();
//   }
  
//   /**
//    * Render dialogue content with word wrapping
//    * @param {Object} contentArea - Area to render within
//    * @param {number} contentArea.x - Left edge
//    * @param {number} contentArea.y - Top edge
//    * @param {number} contentArea.width - Available width
//    * @param {number} contentArea.height - Available height
//    * @returns {Object} Content size { width, height }
//    */
//   renderDialogueContent(contentArea) {
//     // Get p5.js functions (with fallbacks for testing)
//     const p5Push = (typeof global !== 'undefined' && global.push) ||
//                    (typeof window !== 'undefined' && window.push);
//     const p5Pop = (typeof global !== 'undefined' && global.pop) ||
//                   (typeof window !== 'undefined' && window.pop);
//     const p5Fill = (typeof global !== 'undefined' && global.fill) ||
//                    (typeof window !== 'undefined' && window.fill);
//     const p5TextSize = (typeof global !== 'undefined' && global.textSize) ||
//                        (typeof window !== 'undefined' && window.textSize);
//     const p5TextAlign = (typeof global !== 'undefined' && global.textAlign) ||
//                         (typeof window !== 'undefined' && window.textAlign);
//     const p5TextWidth = (typeof global !== 'undefined' && global.textWidth) ||
//                         (typeof window !== 'undefined' && window.textWidth);
//     const p5Text = (typeof global !== 'undefined' && global.text) ||
//                    (typeof window !== 'undefined' && window.text);
//     const p5Image = (typeof global !== 'undefined' && global.image) ||
//                     (typeof window !== 'undefined' && window.image);
//     const p5LoadImage = (typeof global !== 'undefined' && global.loadImage) ||
//                         (typeof window !== 'undefined' && window.loadImage);
//     const LEFT = (typeof global !== 'undefined' && global.LEFT) ||
//                  (typeof window !== 'undefined' && window.LEFT) || 'left';
//     const TOP = (typeof global !== 'undefined' && global.TOP) ||
//                 (typeof window !== 'undefined' && window.TOP) || 'top';
    
//     // Use push/pop for rendering isolation
//     if (p5Push) p5Push();
    
//     // Set text properties
//     if (p5Fill) p5Fill(0);
//     if (p5TextSize) p5TextSize(14);
//     if (p5TextAlign) p5TextAlign(LEFT, TOP);
    
//     // Calculate starting position (offset for portrait if exists)
//     let startX = contentArea.x + 10;
//     let startY = contentArea.y + 10;
    
//     // Render portrait if exists
//     if (this.content.portrait && p5Image) {
//       // Load portrait image (in real game, would cache this)
//       let portraitImg = this.content.portrait;
      
//       // If loadImage is available, try to load it
//       if (p5LoadImage && typeof this.content.portrait === 'string') {
//         portraitImg = p5LoadImage(this.content.portrait);
//       }
      
//       // Draw portrait (64x64px)
//       if (portraitImg) {
//         p5Image(portraitImg, contentArea.x + 10, startY, 64, 64);
//       }
      
//       // Offset text to make room for portrait
//       startX += 74; // 64px portrait + 10px padding
//     }
    
//     // Render word-wrapped text
//     const words = this.content.message.split(' ');
//     let line = '';
//     let y = startY;
//     const maxWidth = contentArea.width - (startX - contentArea.x) - 10;
    
//     for (let word of words) {
//       const testLine = line + word + ' ';
//       const testWidth = p5TextWidth ? p5TextWidth(testLine) : testLine.length * 7;
      
//       if (testWidth > maxWidth && line !== '') {
//         // Draw current line
//         if (p5Text) p5Text(line, startX, y);
//         line = word + ' ';
//         y += 18; // Line height
//       } else {
//         line = testLine;
//       }
//     }
    
//     // Draw final line
//     if (line.length > 0 && p5Text) {
//       p5Text(line, startX, y);
//     }
    
//     if (p5Pop) p5Pop();
    
//     // Return content size
//     return {
//       width: contentArea.width,
//       height: 100 // Approximate height for dialogue text
//     };
//   }
  
//   /**
//    * Update method (called each frame while active)
//    * Handles auto-continue functionality
//    */
//   update() {
//     super.update();
    
//     // Handle auto-continue if configured
//     if (this.content.autoContinue && this.active) {
//       const delay = this.content.autoContinueDelay || 0;
//       const elapsed = this.getElapsedTime();
      
//       // Only auto-continue if there's a single choice (prevent auto-continue with multiple choices)
//       if (this.getChoices().length === 1 && elapsed >= delay) {
//         this.handleChoice(this.getChoices()[0], 0);
//       }
//     }
//   }
  
//   /**
//    * Get the user's response
//    * @returns {string|null} - Response text or null if no response yet
//    */
//   getResponse() {
//     return this._response;
//   }
  
//   /**
//    * Handle button response (legacy method for compatibility)
//    * @param {string} buttonText - Text of clicked button
//    */
//   handleResponse(buttonText) {
//     this._response = buttonText;
    
//     if (this.onResponse) {
//       this.onResponse(buttonText);
//     }
    
//     // Auto-complete on response if configured
//     if (this.autoCompleteOnResponse) {
//       this.complete();
//     }
//   }
// }

// /**
//  * SpawnEvent - Spawn enemies/entities at specified locations
//  * 
//  * Generates spawn positions and triggers entity spawning callbacks.
//  */
// class SpawnEvent extends GameEvent {
//   constructor(config) {
//     super({ ...config, type: 'spawn' });
    
//     // Support spawn callback
//     this.spawnCallback = config.spawnCallback;
//     this.onSpawn = config.onSpawn;
//   }
  
//   /**
//    * Generate spawn positions
//    * @param {Object} [viewport] - Viewport bounds {minX, maxX, minY, maxY}
//    * @returns {Array<Object>} - Array of {x, y} spawn positions
//    */
//   generateSpawnPositions(viewport) {
//     // Custom spawn points
//     if (this.content.spawnPoints && Array.isArray(this.content.spawnPoints)) {
//       return this.content.spawnPoints;
//     }
    
//     // Edge spawning via ViewportSpawnTrigger integration
//     if (this.content.spawnLocations === 'viewport_edge' || this.content.edgeSpawn || this.content.useViewportEdges) {
//       return this._generateEdgePositions(viewport);
//     }
    
//     return [];
//   }
  
//   /**
//    * Generate spawn positions at viewport edges
//    * @private
//    * @param {Object} [viewport] - Viewport bounds
//    * @returns {Array<Object>} - Array of {x, y, edge} spawn positions
//    */
//   _generateEdgePositions(viewport) {
//     const count = this.content.count || this.content.enemyCount || 1;
    
//     // Use provided viewport or get from trigger
//     if (viewport) {
//       return this._generatePositionsAtEdges(count, viewport);
//     }
    
//     // Use ViewportSpawnTrigger if available
//     if (typeof ViewportSpawnTrigger !== 'undefined') {
//       const trigger = new ViewportSpawnTrigger({
//         eventId: this.id,
//         condition: {
//           edgeSpawn: true,
//           count: count,
//           distributeEvenly: this.content.distributeEvenly !== false
//         }
//       });
      
//       return trigger.generateEdgePositions(count);
//     }
    
//     return [];
//   }
  
//   /**
//    * Generate positions at viewport edges
//    * @private
//    */
//   _generatePositionsAtEdges(count, viewport) {
//     const positions = [];
//     const edges = ['top', 'right', 'bottom', 'left'];
    
//     for (let i = 0; i < count; i++) {
//       const edge = edges[i % edges.length];
//       let pos;
      
//       switch (edge) {
//         case 'top':
//           pos = {
//             x: Math.random() * (viewport.maxX - viewport.minX) + viewport.minX,
//             y: viewport.minY
//           };
//           break;
//         case 'bottom':
//           pos = {
//             x: Math.random() * (viewport.maxX - viewport.minX) + viewport.minX,
//             y: viewport.maxY
//           };
//           break;
//         case 'left':
//           pos = {
//             x: viewport.minX,
//             y: Math.random() * (viewport.maxY - viewport.minY) + viewport.minY
//           };
//           break;
//         case 'right':
//           pos = {
//             x: viewport.maxX,
//             y: Math.random() * (viewport.maxY - viewport.minY) + viewport.minY
//           };
//           break;
//       }
      
//       positions.push(pos);
//     }
    
//     return positions;
//   }
  
//   /**
//    * Execute spawn at specific position
//    * @param {Object} position - Spawn position {x, y}
//    */
//   executeSpawn(position) {
//     if (this.onSpawn) {
//       this.onSpawn({
//         enemyType: this.content.enemyType,
//         position: position
//       });
//     }
//   }
  
//   /**
//    * Execute spawn (trigger spawn callback with enemy data)
//    */
//   spawn() {
//     if (!this.spawnCallback) {
//       return;
//     }
    
//     const positions = this.generateSpawnPositions();
//     const enemies = this.content.enemies || [];
    
//     positions.forEach((pos, index) => {
//       const enemyType = enemies[index % enemies.length] || enemies[0] || 'default';
      
//       this.spawnCallback({
//         type: enemyType,
//         x: pos.x,
//         y: pos.y,
//         edge: pos.edge,
//         wave: this.content.wave
//       });
//     });
//   }
  
//   /**
//    * Override trigger to auto-spawn
//    */
//   trigger(data) {
//     super.trigger(data);
//     this.spawn();
//   }
// }

// /**
//  * TutorialEvent - Interactive step-by-step tutorials
//  * 
//  * Multi-step guided tutorials with navigation (next/prev) and completion tracking.
//  */
// class TutorialEvent extends GameEvent {
//   constructor(config) {
//     super({ ...config, type: 'tutorial' });
//     this.currentStep = 0;
//   }
  
//   /**
//    * Get current step index
//    * @returns {number} - Current step (0-based)
//    */
//   getCurrentStep() {
//     return this.currentStep;
//   }
  
//   /**
//    * Get current step content
//    * @returns {Object} - Current step data
//    */
//   getCurrentStepContent() {
//     if (this.content.steps && this.content.steps[this.currentStep]) {
//       return this.content.steps[this.currentStep];
//     }
//     return null;
//   }
  
//   /**
//    * Advance to next step
//    */
//   nextStep() {
//     if (!this.content.steps) {
//       return;
//     }
    
//     if (this.currentStep < this.content.steps.length - 1) {
//       this.currentStep++;
//     } else {
//       // At last step, complete tutorial
//       this.complete();
//     }
//   }
  
//   /**
//    * Go back to previous step
//    */
//   previousStep() {
//     if (this.currentStep > 0) {
//       this.currentStep--;
//     }
//   }
// }

// /**
//  * BossEvent - Boss fight encounters
//  * 
//  * Multi-phase boss fights with intro dialogue, victory/defeat conditions.
//  */
// class BossEvent extends GameEvent {
//   constructor(config) {
//     super({ ...config, type: 'boss' });
//     this._currentPhase = 0;
//   }
  
//   /**
//    * Get current boss phase based on health threshold
//    * @param {number} [healthPercentage] - Boss health (0-1), if provided determines phase
//    * @returns {number} - Current phase index (0-based) or phase number (1-based if health provided)
//    */
//   getCurrentPhase(healthPercentage) {
//     // If health percentage provided, calculate phase based on thresholds
//     if (healthPercentage !== undefined && this.content.phases) {
//       for (let i = this.content.phases.length - 1; i >= 0; i--) {
//         const phase = this.content.phases[i];
//         if (healthPercentage <= phase.healthThreshold) {
//           return i + 1; // Return 1-based phase number
//         }
//       }
//       return 1; // Default to phase 1
//     }
    
//     // Otherwise return current phase index
//     return this._currentPhase;
//   }
  
//   /**
//    * Get current phase content
//    * @returns {Object} - Current phase data
//    */
//   getCurrentPhaseContent() {
//     if (this.content.phases && this.content.phases[this._currentPhase]) {
//       return this.content.phases[this._currentPhase];
//     }
//     return null;
//   }
  
//   /**
//    * Advance to next phase
//    */
//   nextPhase() {
//     if (!this.content.phases) {
//       return;
//     }
    
//     if (this._currentPhase < this.content.phases.length - 1) {
//       this._currentPhase++;
//     }
//   }
  
//   /**
//    * Check victory condition
//    * @returns {boolean} - True if victory condition met
//    */
//   checkVictory() {
//     if (this.content.victoryCondition && typeof this.content.victoryCondition === 'function') {
//       return this.content.victoryCondition();
//     }
//     return false;
//   }
  
//   /**
//    * Check defeat condition
//    * @returns {boolean} - True if defeat condition met
//    */
//   checkDefeat() {
//     if (this.content.defeatCondition && typeof this.content.defeatCondition === 'function') {
//       return this.content.defeatCondition();
//     }
//     return false;
//   }
  
//   /**
//    * Override update to check victory/defeat
//    */
//   update() {
//     super.update();
    
//     if (this.checkVictory()) {
//       this.complete();
//     }
    
//     if (this.checkDefeat()) {
//       this.complete();
//     }
//   }
// }

// // Export for Node.js (testing)
// if (typeof module !== 'undefined' && module.exports) {
//   module.exports = {
//     GameEvent,
//     DialogueEvent,
//     SpawnEvent,
//     TutorialEvent,
//     BossEvent
//   };
// }

// // Export for browser (global)
// if (typeof window !== 'undefined') {
//   window.GameEvent = GameEvent;
//   window.DialogueEvent = DialogueEvent;
//   window.SpawnEvent = SpawnEvent;
//   window.TutorialEvent = TutorialEvent;
//   window.BossEvent = BossEvent;
// }

// // Export for Node.js global (testing compatibility)
// if (typeof global !== 'undefined') {
//   global.GameEvent = GameEvent;
//   global.DialogueEvent = DialogueEvent;
//   global.SpawnEvent = SpawnEvent;
//   global.TutorialEvent = TutorialEvent;
//   global.BossEvent = BossEvent;
// }
