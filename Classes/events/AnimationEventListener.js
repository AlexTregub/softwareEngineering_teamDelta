/**
 * AnimationEventListener
 * ======================
 * Subscribes to entity animation events and triggers AnimationManager
 * 
 * This bridges the event-driven MVC system with the legacy AnimationManager.
 * Instead of controllers directly calling animationManager.play(), they emit
 * ANIMATION_PLAY_REQUESTED events which this listener handles.
 * 
 * USAGE:
 *   // In sketch.js setup() or initialization
 *   const animListener = new AnimationEventListener();
 * 
 * BENEFITS:
 * - Decouples controllers from AnimationManager
 * - Single point of animation coordination
 * - Easy to disable/enable animation system
 * - Can add animation queuing/priority logic here
 */

class AnimationEventListener {
  constructor() {
    this.eventBus = null;
    this.animationManager = null;
    this.enabled = true;
    
    this._initialize();
  }
  
  /**
   * Initialize listener and subscribe to events
   * @private
   */
  _initialize() {
    // Get EventManager instance
    if (typeof EventManager !== 'undefined') {
      this.eventBus = EventManager.getInstance();
    } else {
      console.warn('AnimationEventListener: EventManager not available');
      return;
    }
    
    // Get AnimationManager instance
    if (typeof animationManager !== 'undefined') {
      this.animationManager = animationManager;
    } else {
      console.warn('AnimationEventListener: animationManager not available');
      return;
    }
    
    // Subscribe to animation events
    this._subscribeToEvents();
  }
  
  /**
   * Subscribe to all relevant animation events
   * @private
   */
  _subscribeToEvents() {
    if (!this.eventBus || typeof EntityEvents === 'undefined') return;
    
    // Animation play requests
    this.eventBus.on(EntityEvents.ANIMATION_PLAY_REQUESTED, (data) => {
      this._handleAnimationRequest(data);
    });
    
    // Auto-play animations on specific events
    this.eventBus.on(EntityEvents.ANT_DAMAGED, (data) => {
      this._playAnimation(data.ant, 'Attack');
    });
    
    this.eventBus.on(EntityEvents.ANT_ATTACKED, (data) => {
      this._playAnimation(data.ant, 'Attack');
    });
    
    // Walking animation when moving
    this.eventBus.on(EntityEvents.ANT_MOVE_STARTED, (data) => {
      this._playAnimation(data.ant, 'Walking');
    });
    
    console.log('AnimationEventListener: Subscribed to animation events');
  }
  
  /**
   * Handle animation play request
   * @private
   * @param {Object} data - Event data
   */
  _handleAnimationRequest(data) {
    if (!this.enabled) return;
    if (!data || !data.entity || !data.animationName) return;
    
    this._playAnimation(data.entity, data.animationName);
  }
  
  /**
   * Play animation on entity
   * @private
   * @param {Object} entity - Entity to animate (controller with setImage/jobName)
   * @param {string} animationName - Animation name (Attack, Walking, etc.)
   */
  _playAnimation(entity, animationName) {
    if (!this.enabled) return;
    if (!this.animationManager) return;
    if (!entity) return;
    
    // Check if animation exists
    if (!this.animationManager.isAnimation(animationName)) {
      return; // Animation not available
    }
    
    // Check if entity has required interface
    if (!entity.jobName && !entity.model?.getJobName) {
      console.warn('AnimationEventListener: Entity missing jobName for animation');
      return;
    }
    
    // Play animation
    try {
      this.animationManager.play(entity, animationName);
      
      // Emit animation started event
      if (this.eventBus && typeof EntityEvents !== 'undefined') {
        this.eventBus.emit(EntityEvents.ANIMATION_STARTED, {
          entity: entity,
          animationName: animationName
        });
      }
    } catch (error) {
      console.error('AnimationEventListener: Error playing animation:', error);
    }
  }
  
  /**
   * Enable animation system
   */
  enable() {
    this.enabled = true;
  }
  
  /**
   * Disable animation system
   */
  disable() {
    this.enabled = false;
  }
  
  /**
   * Check if enabled
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled;
  }
  
  /**
   * Cleanup and unsubscribe
   */
  destroy() {
    // EventManager handles cleanup automatically via weak references
    this.eventBus = null;
    this.animationManager = null;
  }
}

// ===== EXPORTS =====

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnimationEventListener;
}

if (typeof window !== 'undefined') {
  window.AnimationEventListener = AnimationEventListener;
}

if (typeof global !== 'undefined') {
  global.AnimationEventListener = AnimationEventListener;
}
