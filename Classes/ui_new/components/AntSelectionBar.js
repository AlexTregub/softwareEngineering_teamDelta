/**
 * AntSelectionBar
 * @module ui_new/components/AntSelectionBar
 * 
 * Manages a panel of ant selection buttons for quick access to ant groups
 * Allows selecting all ants of a specific job type (Builder, Scout, etc.) or Queen
 * 
 * Features:
 * - Background panel (similar to PowerButtonPanel style)
 * - Multiple job type buttons (horizontal layout)
 * - Queen button with double-click camera focus
 * - Ant count display per job type
 * - Hover states and visual feedback
 */

class AntSelectionBar {
  /**
   * Create an ant selection bar
   * @param {Object} p5Instance - p5.js instance
   * @param {Object} [options={}] - Configuration options
   * @param {number} [options.normalizedX] - Normalized X position (-1 to 1, 0 = center)
   * @param {number} [options.normalizedY] - Normalized Y position (-1 to 1, 0 = center)
   * @param {string} [options.faction='player'] - Faction to display ants for
   * @param {string[]} [options.jobTypes] - Job types to display buttons for
   * @param {number} [options.buttonWidth=80] - Button width in pixels
   * @param {number} [options.buttonHeight=50] - Button height in pixels
   * @param {number} [options.buttonSpacing=10] - Spacing between buttons
   * @param {string} [options.bgColor='rgba(0, 0, 0, 0.7)'] - Background color
   */
  constructor(p5Instance, options = {}) {
    this.p5 = p5Instance;
    
    // Coordinate converter for normalized UI positioning
    this.coordConverter = new UICoordinateConverter(p5Instance);
    
    // Configuration
    this.faction = options.faction || 'player';
    this.buttonWidth = options.buttonWidth || 80;
    this.buttonHeight = options.buttonHeight || 50;
    this.buttonSpacing = options.buttonSpacing || 10;
    this.padding = 12;
    this.bgColor = options.bgColor || 'rgba(0, 0, 0, 0.7)';
    
    // Job types to display (default: Queen first, then main job types)
    this.jobTypes = options.jobTypes || [
      { name: 'Queen', value: 'queen', keybind: 'Q', isQueen: true },
      { name: 'Builder', value: 'builder', keybind: 'W' },
      { name: 'Scout', value: 'scout', keybind: 'F' },
      { name: 'Farmer', value: 'farmer', keybind: 'R' },
      { name: 'Warrior', value: 'warrior', keybind: 'T' },
      { name: 'Spitter', value: 'spitter', keybind: 'U' }
    ];
    
    // Sprite paths for each job type
    this.spritePaths = {
      'Builder': 'Images/Ants/gray_ant_builder.png',
      'Scout': 'Images/Ants/gray_ant_scout.png',
      'Farmer': 'Images/Ants/gray_ant_farmer.png',
      'Warrior': 'Images/Ants/gray_ant_soldier.png',
      'Spitter': 'Images/Ants/gray_ant_spitter.png',
      'Queen': 'Images/Ants/gray_ant_queen.png'
    };
    
    // Load sprite images
    this.sprites = {};
    this._loadSprites();
    
    // Calculate panel dimensions
    this.width = this._calculateWidth();
    this.height = 60 + (this.padding * 2); // Use Queen's height (largest button)
    
    // Position in normalized coordinates (default: bottom-left)
    const normalizedX = options.normalizedX !== undefined ? options.normalizedX : -0.6;
    const normalizedY = options.normalizedY !== undefined ? options.normalizedY : -0.85;
    
    // Convert normalized to screen coordinates
    const screenPos = this.coordConverter.normalizedToScreen(normalizedX, normalizedY);
    this.x = screenPos.x - this.width / 2; // Center panel on position
    this.y = screenPos.y - this.height / 2;
    
    // Create buttons
    this.buttons = [];
    this._createButtons();
    
    // State
    this.enabled = true;
    this.hoveredButton = null;
    
    // DEBUG: Log panel creation
    console.log('🎨 AntSelectionBar created:');
    console.log(`   Position: (${this.x.toFixed(1)}, ${this.y.toFixed(1)})`);
    console.log(`   Size: ${this.width}x${this.height}`);
    console.log(`   Normalized coords: (${normalizedX}, ${normalizedY})`);
    console.log(`   Buttons: ${this.buttons.length}`);
    this.buttons.forEach((btn, i) => {
      console.log(`   ${i}. ${btn.jobType}: jobName=${btn.jobName}, keybind=${btn.keybind}, sprite=${!!btn.sprite}`);
    });
  }

  /**
   * Load sprite images for buttons
   * @private
   */
  _loadSprites() {
    this.jobTypes.forEach(job => {
      const path = this.spritePaths[job.name];
      if (path && typeof this.p5.loadImage === 'function') {
        // Check if image already loaded in window cache
        const cacheKey = `antSprite_${job.value}`;
        if (window[cacheKey]) {
          this.sprites[job.value] = window[cacheKey];
        } else {
          this.p5.loadImage(path, (img) => {
            this.sprites[job.value] = img;
            window[cacheKey] = img; // Cache for reuse
          }, (err) => {
            console.warn(`⚠️ Failed to load sprite for ${job.name}:`, err);
          });
        }
      }
    });
  }

  /**
   * Calculate panel width based on button count
   * @private
   * @returns {number} Panel width
   */
  _calculateWidth() {
    // Calculate width based on button sizes (Queen is larger)
    let totalWidth = 0;
    this.jobTypes.forEach((job, index) => {
      const buttonWidth = job.isQueen ? 100 : this.buttonWidth;
      totalWidth += buttonWidth;
      if (index < this.jobTypes.length - 1) {
        totalWidth += this.buttonSpacing;
      }
    });
    return totalWidth + (this.padding * 2);
  }

  /**
   * Create ant selection buttons
   * @private
   */
  _createButtons() {
    const startX = this.x + this.padding;
    const centerY = this.y + this.height / 2;
    
    let currentX = startX;

    this.jobTypes.forEach((job, index) => {
      // Queen button is larger
      const buttonWidth = job.isQueen ? 100 : this.buttonWidth;
      const buttonHeight = job.isQueen ? 60 : this.buttonHeight;
      
      // Calculate button position
      const buttonX = currentX;
      const buttonY = centerY - (buttonHeight / 2);

      this.buttons.push({
        jobType: job.value,
        jobName: job.name,
        keybind: job.keybind,
        isQueen: job.isQueen || false,
        x: buttonX,
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight,
        hover: false
        // Note: sprite is accessed dynamically from this.sprites during render
      });
      
      // Update position for next button
      currentX += buttonWidth + this.buttonSpacing;
    });
  }

  /**
   * Update button states (hover detection)
   */
  update() {
    if (!this.enabled) return;

    // Get mouse position (screen coordinates)
    const mouseX = this.p5.mouseX;
    const mouseY = this.p5.mouseY;

    // Update hover states
    this.hoveredButton = null;
    this.buttons.forEach(button => {
      button.isHovered = this._isPointInButton(mouseX, mouseY, button);
      if (button.isHovered) {
        this.hoveredButton = button;
      }
    });
  }

  /**
   * Render panel and all buttons
   */
  render() {
    if (!this.enabled) return;

    // Render background panel
    this._renderBackground();

    // Render all buttons
    this.buttons.forEach(button => {
      this._renderButton(button);
    });
  }

  /**
   * Render panel background
   * @private
   */
  _renderBackground() {
    this.p5.push();
    
    // Background
    this.p5.fill(this.bgColor);
    this.p5.noStroke();
    this.p5.rect(this.x, this.y, this.width, this.height, 8); // Rounded corners
    
    // Border (subtle outline)
    this.p5.noFill();
    this.p5.stroke(255, 255, 255, 50);
    this.p5.strokeWeight(1);
    this.p5.rect(this.x, this.y, this.width, this.height, 8);
    
    this.p5.pop();
  }

  /**
   * Render individual button
   * @private
   * @param {Object} button - Button to render
   */
  _renderButton(button) {
    this.p5.push();
    
    // Button background (darker when hovered)
    if (button.isHovered) {
      this.p5.fill(80, 80, 120, 200); // Lighter blue-gray when hovered
      this.p5.stroke(150, 150, 200);
      this.p5.strokeWeight(2);
    } else {
      this.p5.fill(40, 40, 60, 180); // Dark blue-gray
      this.p5.stroke(100, 100, 140);
      this.p5.strokeWeight(1);
    }
    
    this.p5.rect(button.x, button.y, button.width, button.height, 4);
    
    // Render sprite icon if available (centered horizontally and vertically)
    // Access sprite dynamically from this.sprites (loaded asynchronously)
    const sprite = this.sprites[button.jobType];
    if (sprite && sprite.width > 0) {
      const spriteSize = 36; // Icon size
      const spriteX = button.x + button.width / 2; // Center horizontally
      const spriteY = button.y + button.height / 2; // Center vertically
      
      // Use noSmooth for pixel-perfect rendering
      this.p5.push();
      this.p5.noSmooth();
      this.p5.imageMode(this.p5.CENTER); // Center the image on the coordinates
      this.p5.image(sprite, spriteX, spriteY, spriteSize, spriteSize);
      this.p5.pop();
    }
    
    // Render job name (bottom-left corner, 10px font)
    if (button.jobName) {
      this.p5.fill(255, 255, 255);
      this.p5.textAlign(this.p5.LEFT, this.p5.BOTTOM);
      this.p5.textSize(10);
      this.p5.textStyle(this.p5.NORMAL);
      this.p5.text(button.jobName, button.x + 5, button.y + button.height - 5);
    }
    
    // Render keybind indicator (top-left corner)
    if (button.keybind) {
      this._renderKeybindIndicator(button);
    }
    
    this.p5.pop();
  }
  
  /**
   * Render keybind indicator in top-left corner
   * @private
   * @param {Object} button - Button object
   */
  _renderKeybindIndicator(button) {
    this.p5.push();
    
    // Position in top-left corner
    const indicatorSize = 18;
    const padding = 4;
    const cornerX = button.x + padding;
    const cornerY = button.y + padding;
    
    // Background circle
    this.p5.fill(0, 0, 0, 180); // Semi-transparent black
    this.p5.noStroke();
    this.p5.ellipse(cornerX + indicatorSize / 2, cornerY + indicatorSize / 2, indicatorSize);
    
    // Keybind text
    this.p5.fill(255, 255, 255); // White text
    this.p5.textAlign(this.p5.CENTER, this.p5.CENTER);
    this.p5.textSize(12);
    this.p5.textStyle(this.p5.BOLD);
    this.p5.text(button.keybind, cornerX + indicatorSize / 2, cornerY + indicatorSize / 2);
    
    this.p5.pop();
  }

  /**
   * Check if point is inside button bounds
   * @private
   * @param {number} px - Point X
   * @param {number} py - Point Y
   * @param {Object} button - Button to check
   * @returns {boolean} True if inside button
   */
  _isPointInButton(px, py, button) {
    return px >= button.x && px <= button.x + button.width &&
           py >= button.y && py <= button.y + button.height;
  }

  /**
   * Check if point is inside panel bounds
   * @private
   * @param {number} px - Point X
   * @param {number} py - Point Y
   * @returns {boolean} True if inside panel
   */
  _isPointInPanel(px, py) {
    return px >= this.x && px <= this.x + this.width &&
           py >= this.y && py <= this.y + this.height;
  }

  /**
   * Handle click on panel
   * @param {number} x - Click X position (screen coordinates)
   * @param {number} y - Click Y position (screen coordinates)
   * @returns {boolean} True if click was handled
   */
  handleClick(x, y) {
    console.log(`🖱️ AntSelectionBar.handleClick at (${x}, ${y})`);
    
    if (!this.enabled) {
      console.log('   ❌ Panel disabled');
      return false;
    }

    // Check if click is inside panel bounds
    if (!this._isPointInPanel(x, y)) {
      console.log(`   ❌ Outside panel bounds`);
      return false;
    }

    console.log(`   ✅ Inside panel bounds`);

    // Check each button
    for (const button of this.buttons) {
      if (this._isPointInButton(x, y, button)) {
        console.log(`   ✅ Clicked ${button.jobType} button`);
        this._onButtonClick(button);
        return true;
      }
    }

    console.log('   ⚠️ Click inside panel but no button hit');
    return false;
  }

  /**
   * Handle button click
   * @private
   * @param {Object} button - Button that was clicked
   */
  _onButtonClick(button) {
    // Check if EntityManager is available
    if (typeof window.entityManager === 'undefined' || !window.entityManager) {
      console.warn('⚠️ EntityManager not available (window.entityManager)');
      return;
    }

    if (button.isQueen) {
      // Check if queen is already selected
      const queen = typeof getQueen === 'function' ? getQueen() : null;
      const isQueenAlreadySelected = queen && queen.isSelected === true;
      
      if (isQueenAlreadySelected) {
        // Toggle camera follow mode
        console.log('👑 Queen already selected - toggling camera follow...');
        if (typeof cameraManager !== 'undefined' && cameraManager && typeof cameraManager.toggleFollow === 'function') {
          cameraManager.toggleFollow();
          console.log('   ✅ Camera follow toggled');
        } else {
          console.warn('   ⚠️ cameraManager.toggleFollow() not available');
        }
      } else {
        // Select queen (double-click focuses camera automatically)
        console.log('👑 Selecting Queen...');
        const selectedQueen = window.entityManager.selectQueen(this.faction);
        if (selectedQueen) {
          console.log(`   ✅ Queen selected: ${selectedQueen._id}`);
        } else {
          console.log('   ⚠️ No queen found for faction:', this.faction);
        }
      }
    } else {
      // Select all ants of this job type
      console.log(`🐜 Selecting all ${button.jobType} ants...`);
      const selectedAnts = window.entityManager.selectAntsByJob(button.jobType, this.faction);
      console.log(`   ✅ Selected ${selectedAnts.length} ${button.jobType}(s)`);
    }
  }

  /**
   * Register interactive handlers with RenderManager
   */
  registerInteractive() {
    if (typeof RenderManager === 'undefined') {
      console.warn('⚠️ RenderManager not available for AntSelectionBar interactive registration');
      return;
    }

    RenderManager.addInteractiveDrawable(RenderManager.layers.UI_GAME, {
      id: 'ant-selection-bar',
      hitTest: (pointer) => {
        if (typeof GameState !== 'undefined' && GameState.getState() !== 'PLAYING') return false;
        const x = pointer.screen ? pointer.screen.x : pointer.x;
        const y = pointer.screen ? pointer.screen.y : pointer.y;
        return this._isPointInPanel(x, y);
      },
      onPointerDown: (pointer) => {
        if (typeof GameState !== 'undefined' && GameState.getState() !== 'PLAYING') return false;
        const x = pointer.screen ? pointer.screen.x : pointer.x;
        const y = pointer.screen ? pointer.screen.y : pointer.y;
        return this.handleClick(x, y);
      }
    });
    
    console.log('✅ AntSelectionBar interactive registration complete');
  }

  /**
   * Enable/disable panel
   * @param {boolean} enabled - True to enable, false to disable
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Get button by job type
   * @param {string} jobType - Job type name
   * @returns {Object|null} Button or null
   */
  getButton(jobType) {
    return this.buttons.find(b => b.jobType === jobType) || null;
  }
}

// Make globally available
if (typeof window !== 'undefined') {
  window.AntSelectionBar = AntSelectionBar;
}

// Node.js export for testing
if (typeof module !== 'undefined' && module.exports && typeof window === 'undefined') {
  module.exports = AntSelectionBar;
}
