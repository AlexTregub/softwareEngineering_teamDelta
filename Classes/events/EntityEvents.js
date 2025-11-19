/**
 * EntityEvents - Centralized Event Constants for Entity System
 * 
 * Provides intellisense-friendly event names for the EventManager pub/sub system.
 * All entity-related events flow through EventManager for decoupled communication.
 * 
 * USAGE:
 *   // Subscribe
 *   EventManager.getInstance().on(EntityEvents.ANT_DAMAGED, (data) => { ... });
 * 
 *   // Publish
 *   EventManager.getInstance().emit(EntityEvents.ANT_DAMAGED, { ant: this, damage: 10 });
 * 
 * @module EntityEvents
 * @see {@link Classes/managers/EventManager.js}
 */

const EntityEvents = {
  // ===== ANT LIFECYCLE EVENTS =====
  
  /**
   * Fired when an ant is created
   * @event ANT_CREATED
   * @type {Object}
   * @property {AntController} ant - The ant controller instance
   * @property {string} jobName - Job type (Worker, Warrior, Scout, etc.)
   * @property {Object} position - {x, y} spawn position
   */
  ANT_CREATED: 'entity:ant:created',
  
  /**
   * Fired when an ant dies
   * @event ANT_DIED
   * @type {Object}
   * @property {AntController} ant - The ant controller instance
   * @property {string} cause - Death cause (combat, starvation, etc.)
   * @property {Object} position - {x, y} death position
   */
  ANT_DIED: 'entity:ant:died',
  
  /**
   * Fired when an ant is destroyed/removed
   * @event ANT_DESTROYED
   * @type {Object}
   * @property {string} antId - The ant's unique ID
   * @property {number} antIndex - The ant's index
   */
  ANT_DESTROYED: 'entity:ant:destroyed',
  
  // ===== ANT HEALTH EVENTS =====
  
  /**
   * Fired when an ant takes damage
   * @event ANT_DAMAGED
   * @type {Object}
   * @property {AntController} ant - The ant controller instance
   * @property {number} damage - Damage amount
   * @property {number} healthBefore - Health before damage
   * @property {number} healthAfter - Health after damage
   * @property {Object} [attacker] - Attacker entity (optional)
   */
  ANT_DAMAGED: 'entity:ant:damaged',
  
  /**
   * Fired when an ant is healed
   * @event ANT_HEALED
   * @type {Object}
   * @property {AntController} ant - The ant controller instance
   * @property {number} amount - Heal amount
   * @property {number} healthBefore - Health before healing
   * @property {number} healthAfter - Health after healing
   */
  ANT_HEALED: 'entity:ant:healed',
  
  /**
   * Fired when an ant's health reaches critical level (<30%)
   * @event ANT_HEALTH_CRITICAL
   * @type {Object}
   * @property {AntController} ant - The ant controller instance
   * @property {number} healthPercent - Current health percentage
   */
  ANT_HEALTH_CRITICAL: 'entity:ant:health:critical',
  
  // ===== ANT COMBAT EVENTS =====
  
  /**
   * Fired when an ant attacks another entity
   * @event ANT_ATTACKED
   * @type {Object}
   * @property {AntController} ant - The attacking ant
   * @property {Object} target - The target entity
   * @property {number} damage - Damage dealt
   */
  ANT_ATTACKED: 'entity:ant:attacked',
  
  /**
   * Fired when an ant enters combat
   * @event ANT_COMBAT_ENTERED
   * @type {Object}
   * @property {AntController} ant - The ant controller instance
   * @property {Object} enemy - The enemy entity
   */
  ANT_COMBAT_ENTERED: 'entity:ant:combat:entered',
  
  /**
   * Fired when an ant exits combat
   * @event ANT_COMBAT_EXITED
   * @type {Object}
   * @property {AntController} ant - The ant controller instance
   * @property {string} reason - Exit reason (victory, flee, etc.)
   */
  ANT_COMBAT_EXITED: 'entity:ant:combat:exited',
  
  // ===== ANT STATE EVENTS =====
  
  /**
   * Fired when an ant's state changes
   * @event ANT_STATE_CHANGED
   * @type {Object}
   * @property {AntController} ant - The ant controller instance
   * @property {string} oldState - Previous state (IDLE, MOVING, etc.)
   * @property {string} newState - New state
   */
  ANT_STATE_CHANGED: 'entity:ant:state:changed',
  
  /**
   * Fired when an ant starts moving
   * @event ANT_MOVE_STARTED
   * @type {Object}
   * @property {AntController} ant - The ant controller instance
   * @property {Object} destination - {x, y} target position
   */
  ANT_MOVE_STARTED: 'entity:ant:move:started',
  
  /**
   * Fired when an ant reaches its destination
   * @event ANT_MOVE_COMPLETED
   * @type {Object}
   * @property {AntController} ant - The ant controller instance
   * @property {Object} position - {x, y} final position
   */
  ANT_MOVE_COMPLETED: 'entity:ant:move:completed',
  
  /**
   * Fired when an ant starts gathering
   * @event ANT_GATHERING_STARTED
   * @type {Object}
   * @property {AntController} ant - The ant controller instance
   */
  ANT_GATHERING_STARTED: 'entity:ant:gathering:started',
  
  /**
   * Fired when an ant stops gathering
   * @event ANT_GATHERING_STOPPED
   * @type {Object}
   * @property {AntController} ant - The ant controller instance
   * @property {string} reason - Stop reason (capacity, interrupted, etc.)
   */
  ANT_GATHERING_STOPPED: 'entity:ant:gathering:stopped',
  
  // ===== ANT RESOURCE EVENTS =====
  
  /**
   * Fired when an ant collects a resource
   * @event ANT_RESOURCE_COLLECTED
   * @type {Object}
   * @property {AntController} ant - The ant controller instance
   * @property {number} amount - Amount collected
   * @property {number} totalCarried - Total resources carried
   * @property {number} capacity - Max capacity
   */
  ANT_RESOURCE_COLLECTED: 'entity:ant:resource:collected',
  
  /**
   * Fired when an ant deposits resources
   * @event ANT_RESOURCE_DEPOSITED
   * @type {Object}
   * @property {AntController} ant - The ant controller instance
   * @property {number} amount - Amount deposited
   * @property {Object} dropoff - Dropoff location
   */
  ANT_RESOURCE_DEPOSITED: 'entity:ant:resource:deposited',
  
  /**
   * Fired when an ant reaches max capacity
   * @event ANT_CAPACITY_REACHED
   * @type {Object}
   * @property {AntController} ant - The ant controller instance
   * @property {number} capacity - Max capacity reached
   */
  ANT_CAPACITY_REACHED: 'entity:ant:resource:capacity:reached',
  
  // ===== ANT JOB EVENTS =====
  
  /**
   * Fired when an ant's job changes
   * @event ANT_JOB_CHANGED
   * @type {Object}
   * @property {AntController} ant - The ant controller instance
   * @property {string} oldJob - Previous job name
   * @property {string} newJob - New job name
   * @property {Object} stats - New job stats
   */
  ANT_JOB_CHANGED: 'entity:ant:job:changed',
  
  // ===== ANT SELECTION EVENTS =====
  
  /**
   * Fired when an ant is selected
   * @event ANT_SELECTED
   * @type {Object}
   * @property {AntController} ant - The ant controller instance
   */
  ANT_SELECTED: 'entity:ant:selected',
  
  /**
   * Fired when an ant is deselected
   * @event ANT_DESELECTED
   * @type {Object}
   * @property {AntController} ant - The ant controller instance
   */
  ANT_DESELECTED: 'entity:ant:deselected',
  
  // ===== SELECTION BOX EVENTS =====
  
  /**
   * Fired when selection box bounds update (during drag)
   * @event SELECTION_BOX_UPDATE
   * @type {Object}
   * @property {Object} worldBounds - {minX, minY, maxX, maxY, width, height} in world coords
   * @property {Object} screenBounds - {minX, minY, maxX, maxY, width, height} in screen coords
   * @property {number} entityCount - Number of entities under box
   */
  SELECTION_BOX_UPDATE: 'selection:box:update',
  
  /**
   * Fired when selection box is released (selection complete)
   * @event SELECTION_BOX_COMPLETE
   * @type {Object}
   * @property {number} selectedCount - Number of entities selected
   * @property {Array<Object>} entities - Selected entity controllers
   */
  SELECTION_BOX_COMPLETE: 'selection:box:complete',
  
  // ===== RENDER EVENTS =====
  
  /**
   * Request to register a drawable with RenderLayerManager
   * @event RENDER_REGISTER_DRAWABLE
   * @type {Object}
   * @property {string} layer - Layer name (TERRAIN, ENTITIES, EFFECTS, UI_GAME, UI_DEBUG, UI_MENU)
   * @property {Function} drawFn - Drawing function to call
   * @property {string} id - Unique identifier for this drawable
   */
  RENDER_REGISTER_DRAWABLE: 'render:register:drawable',
  
  /**
   * Request to unregister a drawable from RenderLayerManager
   * @event RENDER_UNREGISTER_DRAWABLE
   * @type {Object}
   * @property {string} id - Unique identifier of drawable to remove
   */
  RENDER_UNREGISTER_DRAWABLE: 'render:unregister:drawable',
  
  // ===== ANIMATION EVENTS (for AnimationManager integration) =====
  
  /**
   * Request to play animation on entity
   * @event ANIMATION_PLAY_REQUESTED
   * @type {Object}
   * @property {Object} entity - Entity to animate (controller with setImage/jobName)
   * @property {string} animationName - Animation name (Attack, Walking, etc.)
   */
  ANIMATION_PLAY_REQUESTED: 'entity:animation:play:requested',
  
  /**
   * Animation started playing
   * @event ANIMATION_STARTED
   * @type {Object}
   * @property {Object} entity - Entity being animated
   * @property {string} animationName - Animation name
   */
  ANIMATION_STARTED: 'entity:animation:started',
  
  /**
   * Animation completed
   * @event ANIMATION_COMPLETED
   * @type {Object}
   * @property {Object} entity - Entity that was animated
   * @property {string} animationName - Animation name
   */
  ANIMATION_COMPLETED: 'entity:animation:completed',
  
  // ===== ENTITY GENERIC EVENTS =====
  
  /**
   * Fired when any entity is created
   * @event ENTITY_CREATED
   * @type {Object}
   * @property {EntityController} entity - The entity controller instance
   * @property {string} type - Entity type
   */
  ENTITY_CREATED: 'entity:created',
  
  /**
   * Fired when any entity is destroyed
   * @event ENTITY_DESTROYED
   * @type {Object}
   * @property {string} entityId - The entity's unique ID
   * @property {string} type - Entity type
   */
  ENTITY_DESTROYED: 'entity:destroyed',
  
  /**
   * Fired when entity position changes significantly
   * @event ENTITY_MOVED
   * @type {Object}
   * @property {EntityController} entity - The entity controller instance
   * @property {Object} oldPosition - {x, y} previous position
   * @property {Object} newPosition - {x, y} new position
   */
  ENTITY_MOVED: 'entity:moved',
  
  // ===== SYSTEM EVENTS =====
  
  /**
   * Fired when game enters combat state
   * @event COMBAT_STARTED
   * @type {Object}
   * @property {Array<Object>} combatants - All entities in combat
   */
  COMBAT_STARTED: 'system:combat:started',
  
  /**
   * Fired when game exits combat state
   * @event COMBAT_ENDED
   * @type {Object}
   * @property {string} result - Combat result (victory, defeat, etc.)
   */
  COMBAT_ENDED: 'system:combat:ended',
  
  // ===== GAME STATE EVENTS =====
  
  /**
   * Fired when game state changes
   * @event GAME_STATE_CHANGED
   * @type {Object}
   * @property {string} oldState - Previous state (MENU, PLAYING, PAUSED, etc.)
   * @property {string} newState - New state
   * @property {number} timestamp - When state changed (Date.now())
   */
  GAME_STATE_CHANGED: 'game:state:changed',
  
  /**
   * Fired when game enters PLAYING state
   * @event GAME_PLAYING_STARTED
   * @type {Object}
   * @property {number} timestamp - When game started playing (Date.now())
   */
  GAME_PLAYING_STARTED: 'game:playing:started',
  
  /**
   * Fired when game exits PLAYING state
   * @event GAME_PLAYING_STOPPED
   * @type {Object}
   * @property {string} reason - Why game stopped (PAUSED, MENU, GAME_OVER, etc.)
   * @property {number} timestamp - When game stopped playing (Date.now())
   */
  GAME_PLAYING_STOPPED: 'game:playing:stopped',
  
  // ===== ANT SPAWNING EVENTS =====
  
  /**
   * Fired when a batch of ants is spawned
   * @event ANTS_BATCH_SPAWNED
   * @type {Object}
   * @property {number} count - Number of ants spawned
   * @property {Array<Object>} ants - Spawned ant MVC triads
   * @property {Object} location - Spawn location {x, y}
   */
  ANTS_BATCH_SPAWNED: 'ants:batch:spawned',
  
  /**
   * Fired when ant factory is ready
   * @event ANT_FACTORY_READY
   * @type {Object}
   * @property {AntFactory} factory - Factory class reference
   */
  ANT_FACTORY_READY: 'ant:factory:ready',
};

// Freeze to prevent modification (immutable constants)
Object.freeze(EntityEvents);

// ===== EXPORTS =====

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EntityEvents;
}

if (typeof window !== 'undefined') {
  window.EntityEvents = EntityEvents;
}

if (typeof global !== 'undefined') {
  global.EntityEvents = EntityEvents;
}

/**
 * TYPE DEFINITIONS for intellisense
 * @typedef {Object} EntityEventData
 * @property {AntController|EntityController} [ant] - Ant controller
 * @property {EntityController} [entity] - Entity controller
 * @property {number} [damage] - Damage amount
 * @property {number} [amount] - Generic amount
 * @property {Object} [position] - {x, y} position
 * @property {string} [reason] - Reason/cause string
 * @property {Object} [target] - Target entity
 * @property {string} [oldState] - Previous state
 * @property {string} [newState] - New state
 */
