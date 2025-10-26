/**
 * DialogueEvent - Implementation Skeleton
 * 
 * This is a starter template based on the test suite requirements.
 * Complete each TODO to make the tests pass.
 * 
 * Run tests: npm run test:dialogue
 */

class DialogueEvent extends Event {
  /**
   * Constructor
   * @param {Object} config - Event configuration
   * @param {string} config.id - Unique event identifier
   * @param {Object} config.content - Dialogue content
   * @param {string} config.content.speaker - Speaker name (defaults to "Dialogue")
   * @param {string} config.content.message - Dialogue message text
   * @param {Array} config.content.choices - Array of choice objects
   * @param {string} [config.content.portrait] - Optional portrait image path
   * @param {boolean} [config.content.autoContinue] - Auto-close dialogue
   * @param {number} [config.content.autoContinueDelay] - Delay before auto-close
   */
  constructor(config) {
    // TODO: Call parent constructor with config
    super(config);
    
    // TODO: Set type to 'dialogue'
    this.type = 'dialogue';
    
    // TODO: Validate message is not empty
    if (!config.content || !config.content.message || config.content.message.trim() === '') {
      throw new Error('DialogueEvent requires a non-empty message');
    }
    
    // TODO: Set default speaker if not provided
    if (!this.content.speaker) {
      this.content.speaker = 'Dialogue';
    }
    
    // TODO: Create default "Continue" choice if no choices provided
    if (!this.content.choices || this.content.choices.length === 0) {
      this.content.choices = [
        { text: 'Continue' }
      ];
    }
    
    // TODO: Store reference to dialogue panel (will be created on trigger)
    this._panel = null;
  }

  /**
   * Get array of choices
   * @returns {Array} Array of choice objects
   */
  getChoices() {
    // TODO: Return filtered/processed choices
    return this.content.choices || [];
  }

  /**
   * Trigger the dialogue event
   * Shows the dialogue panel with choices
   */
  trigger(data) {
    // TODO: Call parent trigger
    super.trigger(data);
    
    // TODO: Get or create dialogue panel from DraggablePanelManager
    // Check if draggablePanelManager exists
    if (typeof draggablePanelManager === 'undefined') {
      console.warn('draggablePanelManager not available');
      return;
    }
    
    // TODO: Create panel configuration
    const panelConfig = {
      id: 'dialogue-display',
      title: this.content.speaker,
      position: {
        x: (window.innerWidth / 2) - 250,
        y: window.innerHeight - 200
      },
      size: {
        width: 500,
        height: 160
      },
      behavior: {
        draggable: false,
        closeable: false,
        minimizable: false
      },
      buttons: {
        layout: 'horizontal',
        autoSizeToContent: true,
        spacing: 10,
        items: this._generateChoiceButtons()
      }
    };
    
    // TODO: Get or create panel
    this._panel = draggablePanelManager.getOrCreatePanel('dialogue-display', panelConfig);
    
    // TODO: Set contentSizeCallback for custom rendering
    this._panel.config.contentSizeCallback = (contentArea) => {
      return this.renderDialogueContent(contentArea);
    };
    
    // TODO: Show the panel
    this._panel.show();
  }

  /**
   * Generate button configurations from choices
   * @returns {Array} Array of button configs
   */
  _generateChoiceButtons() {
    // TODO: Map choices to button configs
    return this.getChoices().map((choice, index) => ({
      caption: choice.text,
      onClick: () => this.handleChoice(choice, index)
    }));
  }

  /**
   * Handle player choice selection
   * @param {Object} choice - The selected choice object
   * @param {number} index - Index of the choice
   */
  handleChoice(choice, index) {
    // TODO: Execute choice callback if exists
    if (choice.onSelect) {
      choice.onSelect(choice);
    }
    
    // TODO: Set event flag for choice tracking
    if (typeof eventManager !== 'undefined') {
      eventManager.setFlag(`${this.id}_choice`, index);
    }
    
    // TODO: Trigger next event if specified
    if (choice.nextEventId && typeof eventManager !== 'undefined') {
      eventManager.triggerEvent(choice.nextEventId);
    }
    
    // TODO: Hide the panel
    if (typeof draggablePanelManager !== 'undefined') {
      draggablePanelManager.hidePanel('dialogue-display');
    }
    
    // TODO: Complete this dialogue event
    this.complete();
  }

  /**
   * Render dialogue content with word wrapping
   * @param {Object} contentArea - Area to render within
   * @param {number} contentArea.x - Left edge
   * @param {number} contentArea.y - Top edge
   * @param {number} contentArea.width - Available width
   * @param {number} contentArea.height - Available height
   * @returns {Object} Content size { width, height }
   */
  renderDialogueContent(contentArea) {
    // TODO: Use push/pop for rendering isolation
    push();
    
    // TODO: Set text properties
    fill(0);
    textSize(14);
    textAlign(LEFT, TOP);
    
    // TODO: Calculate starting position (offset for portrait if exists)
    let startX = contentArea.x + 10;
    let startY = contentArea.y + 10;
    
    // TODO: Render portrait if exists (future feature)
    if (this.content.portrait && typeof image === 'function') {
      // Portrait rendering will be implemented later
      // For now, just reserve space
      startX += 74; // 64px portrait + 10px padding
    }
    
    // TODO: Render word-wrapped text
    const words = this.content.message.split(' ');
    let line = '';
    let y = startY;
    const maxWidth = contentArea.width - (startX - contentArea.x) - 10;
    
    for (let word of words) {
      const testLine = line + word + ' ';
      const testWidth = textWidth(testLine);
      
      if (testWidth > maxWidth && line !== '') {
        // Draw current line
        text(line, startX, y);
        line = word + ' ';
        y += 18; // Line height
      } else {
        line = testLine;
      }
    }
    
    // Draw final line
    if (line.length > 0) {
      text(line, startX, y);
    }
    
    pop();
    
    // TODO: Return content size
    return {
      width: contentArea.width,
      height: 100 // Approximate height for dialogue text
    };
  }

  /**
   * Update method (called each frame while active)
   * Handles auto-continue functionality
   */
  update() {
    super.update();
    
    // TODO: Implement auto-continue if configured
    if (this.content.autoContinue && this.active) {
      const delay = this.content.autoContinueDelay || 0;
      const elapsed = millis() - this.triggeredAt;
      
      // Only auto-continue if there's a single "Continue" choice
      if (this.getChoices().length === 1 && elapsed >= delay) {
        this.handleChoice(this.getChoices()[0], 0);
      }
    }
  }
}

// Export for both browser and Node.js
if (typeof window !== 'undefined') {
  window.DialogueEvent = DialogueEvent;
}
if (typeof module !== 'undefined') {
  module.exports = DialogueEvent;
}
