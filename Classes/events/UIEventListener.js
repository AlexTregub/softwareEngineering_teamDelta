/**
 * UIEventListener
 * ================
 * Listens to entity lifecycle events and updates UI elements accordingly.
 * 
 * Updates:
 * - Health bars when ants take damage/heal
 * - Resource counters when ants collect/deposit
 * - Selection info panel when ants are selected
 * - Combat indicators when ants enter/exit combat
 * - Job badges when ants change jobs
 * - Notifications for critical events (low health, death)
 * 
 * This demonstrates event-driven UI updates without coupling
 * controllers directly to UI systems.
 * 
 * Usage:
 *   const uiListener = new UIEventListener();
 *   uiListener.enable();  // Start listening
 *   uiListener.disable(); // Stop listening
 *   uiListener.destroy(); // Cleanup
 */

// Load dependencies
if (typeof EntityEvents === 'undefined') {
  if (typeof require !== 'undefined') {
    const EntityEvents = require('./EntityEvents.js');
    if (typeof window !== 'undefined') window.EntityEvents = EntityEvents;
    if (typeof global !== 'undefined') global.EntityEvents = EntityEvents;
  }
}

class UIEventListener {
  constructor() {
    // Get EventManager singleton
    this._eventBus = typeof EventManager !== 'undefined' 
      ? EventManager.getInstance() 
      : null;

    // Track active subscriptions (for cleanup)
    this._unsubscribers = [];

    // Track selected ant for info panel
    this._selectedAnt = null;

    // Notification manager reference
    this._notificationManager = typeof NotificationManager !== 'undefined'
      ? NotificationManager.getInstance?.()
      : null;

    // Auto-enable by default
    this._enabled = false;
  }

  /**
   * Enable event listening
   */
  enable() {
    if (this._enabled || !this._eventBus) return;
    
    // Health events
    this._subscribe(EntityEvents.ANT_DAMAGED, this._onAntDamaged.bind(this));
    this._subscribe(EntityEvents.ANT_HEALED, this._onAntHealed.bind(this));
    this._subscribe(EntityEvents.ANT_HEALTH_CRITICAL, this._onHealthCritical.bind(this));
    this._subscribe(EntityEvents.ANT_DIED, this._onAntDied.bind(this));

    // Resource events
    this._subscribe(EntityEvents.ANT_RESOURCE_COLLECTED, this._onResourceCollected.bind(this));
    this._subscribe(EntityEvents.ANT_RESOURCE_DEPOSITED, this._onResourceDeposited.bind(this));
    this._subscribe(EntityEvents.ANT_CAPACITY_REACHED, this._onCapacityReached.bind(this));

    // Selection events
    this._subscribe(EntityEvents.ANT_SELECTED, this._onAntSelected.bind(this));
    this._subscribe(EntityEvents.ANT_DESELECTED, this._onAntDeselected.bind(this));

    // Job events
    this._subscribe(EntityEvents.ANT_JOB_CHANGED, this._onJobChanged.bind(this));

    // Combat events
    this._subscribe(EntityEvents.ANT_COMBAT_ENTERED, this._onCombatEntered.bind(this));
    this._subscribe(EntityEvents.ANT_COMBAT_EXITED, this._onCombatExited.bind(this));

    // State events
    this._subscribe(EntityEvents.ANT_STATE_CHANGED, this._onStateChanged.bind(this));

    this._enabled = true;
    console.log('✅ UIEventListener enabled');
  }

  /**
   * Disable event listening
   */
  disable() {
    if (!this._enabled) return;

    // Unsubscribe from all events
    this._unsubscribers.forEach(unsub => unsub());
    this._unsubscribers = [];

    this._enabled = false;
    console.log('❌ UIEventListener disabled');
  }

  /**
   * Check if listener is enabled
   * @returns {boolean}
   */
  isEnabled() {
    return this._enabled;
  }

  /**
   * Destroy listener and cleanup
   */
  destroy() {
    this.disable();
    this._selectedAnt = null;
    this._eventBus = null;
    this._notificationManager = null;
  }

  // ===== PRIVATE SUBSCRIPTION HELPER =====

  /**
   * Subscribe to event and track unsubscriber
   * @private
   */
  _subscribe(eventName, callback) {
    if (!this._eventBus) return;
    const unsubscribe = this._eventBus.on(eventName, callback);
    this._unsubscribers.push(unsubscribe);
  }

  // ===== HEALTH EVENT HANDLERS =====

  /**
   * Handle ant damaged event
   * @private
   */
  _onAntDamaged(data) {
    const { ant, damage, healthAfter, healthBefore } = data;
    
    // Update health bar if view has renderHealthBar method
    if (ant.view && typeof ant.view.renderHealthBar === 'function') {
      // Health bar updates automatically on next render via model
    }

    // Show damage number (delegated to EffectsRenderer)
    if (ant.effects && typeof ant.effects.damageNumber === 'function') {
      // Already handled by controller
    }

    // Log for selected ant
    if (this._selectedAnt === ant) {
      console.log(`Selected ant took ${damage} damage (${healthAfter}/${ant.model.getMaxHealth()})`);
    }
  }

  /**
   * Handle ant healed event
   * @private
   */
  _onAntHealed(data) {
    const { ant, amount, healthAfter } = data;
    
    // Show heal number
    if (ant.effects && typeof ant.effects.healNumber === 'function') {
      ant.effects.healNumber(amount);
    }

    // Notification for selected ant
    if (this._selectedAnt === ant) {
      this._notify(`Ant healed +${amount} HP`, 'success');
    }
  }

  /**
   * Handle critical health event
   * @private
   */
  _onHealthCritical(data) {
    const { ant, healthPercent } = data;
    
    // Visual indicator (pulsing red highlight)
    if (ant.highlight && typeof ant.highlight.combat === 'function') {
      // Already handled by combat system
    }

    // Notification
    this._notify(`⚠️ Ant health critical (${Math.round(healthPercent)}%)`, 'warning');

    // Play warning sound
    if (typeof playSound === 'function') {
      // playSound('warning');
    }
  }

  /**
   * Handle ant death event
   * @private
   */
  _onAntDied(data) {
    const { ant, cause } = data;
    
    // Clear selection if this ant was selected
    if (this._selectedAnt === ant) {
      this._selectedAnt = null;
    }

    // Notification
    const jobName = ant.jobName || 'Ant';
    this._notify(`💀 ${jobName} died${cause ? ` (${cause})` : ''}`, 'error');

    // Update colony stats
    this._updateColonyStats();
  }

  // ===== RESOURCE EVENT HANDLERS =====

  /**
   * Handle resource collected event
   * @private
   */
  _onResourceCollected(data) {
    const { ant, amount, totalCarried, capacity } = data;
    
    // Update resource counter in UI
    this._updateResourceDisplay(totalCarried, capacity);

    // Show collection feedback
    if (ant.effects && typeof ant.effects.floatingText === 'function') {
      ant.effects.floatingText(`+${amount}`, 'green');
    }

    // Log for selected ant
    if (this._selectedAnt === ant) {
      console.log(`Collected ${amount} (carrying ${totalCarried}/${capacity})`);
    }
  }

  /**
   * Handle resource deposited event
   * @private
   */
  _onResourceDeposited(data) {
    const { ant, amount, dropoff } = data;
    
    // Update colony resource total
    if (typeof window !== 'undefined' && window.colony) {
      // window.colony.resources += amount;
    }

    // Notification for large deposits
    if (amount >= 10) {
      this._notify(`📦 Deposited ${amount} resources`, 'success');
    }

    // Update UI counters
    this._updateColonyStats();
  }

  /**
   * Handle capacity reached event
   * @private
   */
  _onCapacityReached(data) {
    const { ant, capacity } = data;
    
    // Visual feedback (yellow highlight)
    if (ant.highlight && typeof ant.highlight.resourceHover === 'function') {
      // ant.highlight.resourceHover();
    }

    // Notification for selected ant
    if (this._selectedAnt === ant) {
      this._notify(`Inventory full (${capacity}/${capacity})`, 'info');
    }
  }

  // ===== SELECTION EVENT HANDLERS =====

  /**
   * Handle ant selected event
   * @private
   */
  _onAntSelected(data) {
    const { ant } = data;
    
    // Update selected ant reference
    this._selectedAnt = ant;

    // Update selection info panel
    this._updateSelectionPanel(ant);

    // Log selection
    const jobName = ant.jobName || 'Ant';
    const health = ant.model.getHealth();
    const maxHealth = ant.model.getMaxHealth();
    console.log(`Selected ${jobName} (HP: ${health}/${maxHealth})`);
  }

  /**
   * Handle ant deselected event
   * @private
   */
  _onAntDeselected(data) {
    // Clear selected ant
    if (this._selectedAnt === data.ant) {
      this._selectedAnt = null;
    }

    // Hide selection info panel
    this._hideSelectionPanel();
  }

  // ===== JOB EVENT HANDLERS =====

  /**
   * Handle job changed event
   * @private
   */
  _onJobChanged(data) {
    const { ant, oldJob, newJob, stats } = data;
    
    // Update job badge/icon
    if (ant.view) {
      // Job visual updated automatically via model
    }

    // Notification
    this._notify(`Ant promoted: ${oldJob} → ${newJob}`, 'info');

    // Update selected ant info if applicable
    if (this._selectedAnt === ant) {
      this._updateSelectionPanel(ant);
    }
  }

  // ===== COMBAT EVENT HANDLERS =====

  /**
   * Handle combat entered event
   * @private
   */
  _onCombatEntered(data) {
    const { ant, enemy } = data;
    
    // Visual indicator (red highlight)
    if (ant.highlight && typeof ant.highlight.combat === 'function') {
      ant.highlight.combat();
    }

    // Notification for selected ant
    if (this._selectedAnt === ant) {
      const enemyType = enemy.type || 'enemy';
      this._notify(`⚔️ Entered combat with ${enemyType}`, 'warning');
    }
  }

  /**
   * Handle combat exited event
   * @private
   */
  _onCombatExited(data) {
    const { ant, reason } = data;
    
    // Clear combat highlight
    // (handled automatically by controller)

    // Notification for selected ant
    if (this._selectedAnt === ant) {
      this._notify(`Combat ended (${reason})`, 'info');
    }
  }

  // ===== STATE EVENT HANDLERS =====

  /**
   * Handle state changed event
   * @private
   */
  _onStateChanged(data) {
    const { ant, oldState, newState } = data;
    
    // Update selection panel if selected
    if (this._selectedAnt === ant) {
      this._updateSelectionPanel(ant);
    }

    // Log state transitions
    console.log(`Ant state: ${oldState} → ${newState}`);
  }

  // ===== UI UPDATE METHODS =====

  /**
   * Update resource display in UI
   * @private
   */
  _updateResourceDisplay(carried, capacity) {
    // Update UI elements (if they exist)
    const resourceCounter = document.getElementById('resource-counter');
    if (resourceCounter) {
      resourceCounter.textContent = `${carried}/${capacity}`;
    }
  }

  /**
   * Update colony statistics panel
   * @private
   */
  _updateColonyStats() {
    // Update colony stats display
    if (typeof window !== 'undefined') {
      const totalAnts = window.ants?.length || 0;
      const totalResources = window.colony?.resources || 0;
      
      // Update UI elements
      const antCounter = document.getElementById('ant-count');
      if (antCounter) antCounter.textContent = totalAnts;

      const resourceTotal = document.getElementById('resource-total');
      if (resourceTotal) resourceTotal.textContent = totalResources;
    }
  }

  /**
   * Update selection info panel
   * @private
   */
  _updateSelectionPanel(ant) {
    // Update panel with ant details
    const panel = document.getElementById('selection-panel');
    if (!panel) return;

    const jobName = ant.jobName || 'Ant';
    const health = ant.model.getHealth();
    const maxHealth = ant.model.getMaxHealth();
    const state = ant.getCurrentState?.() || 'Unknown';
    const resources = ant.getResourceCount?.() || 0;

    panel.innerHTML = `
      <h3>${jobName}</h3>
      <div class="stat">Health: ${health}/${maxHealth}</div>
      <div class="stat">State: ${state}</div>
      <div class="stat">Resources: ${resources}</div>
    `;
    panel.style.display = 'block';
  }

  /**
   * Hide selection info panel
   * @private
   */
  _hideSelectionPanel() {
    const panel = document.getElementById('selection-panel');
    if (panel) {
      panel.style.display = 'none';
    }
  }

  /**
   * Show notification
   * @private
   */
  _notify(message, type = 'info') {
    if (this._notificationManager && typeof this._notificationManager.show === 'function') {
      this._notificationManager.show(message, type);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }
}

// Export for Node.js/testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIEventListener;
}

// Browser global
if (typeof window !== 'undefined') {
  window.UIEventListener = UIEventListener;
}
