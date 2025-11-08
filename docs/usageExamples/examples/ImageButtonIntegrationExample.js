/**
 * @fileoverview Image Button Integration Example
 * Demonstrates how to add image/texture support to the Universal Button System
 * Shows practical implementation with existing game assets
 * 
 */

/**
 * Enhanced GameActionFactory with Image Button Support
 * This example shows how to create button groups with mixed text and image buttons
 */

// Image Button Configuration Examples
const ImageButtonExamples = {
  
  /**
   * Load button images (call this in your preload function)
   */
  loadButtonImages() {
    this.images = {
      playButton: loadImage("Images/Assets/Menu/play_button.png"),
      debugButton: loadImage("Images/Assets/Menu/debug_button.png"),
      optionsButton: loadImage("Images/Assets/Menu/options_button.png"),
      exitButton: loadImage("Images/Assets/Menu/exit_button.png"),
      antLogo: loadImage("Images/Assets/Menu/ant_logo1.png"),
      infoButton: loadImage("Images/Assets/Menu/info_button.png")
    };
    
    console.log('🖼️ Button images loaded successfully');
  },

  /**
   * Create a button group with mixed image and text buttons
   */
  createImageButtonGroup() {
    const imageButtonConfig = {
      id: 'image-button-demo',
      name: 'Image Button Demonstration',
      layout: {
        type: 'vertical',
        position: { x: 'right', y: 'center' },
        spacing: 15,
        padding: { top: 20, right: 20, bottom: 20, left: 20 }
      },
      appearance: {
        scale: 1.0,
        transparency: 0.95,
        visible: true,
        background: { color: [30, 30, 30, 200], cornerRadius: 10 }
      },
      behavior: {
        draggable: true,
        resizable: false,
        snapToEdges: false
      },
      persistence: {
        savePosition: true,
        storageKey: 'image-button-demo-position'
      },
      buttons: [
        {
          id: 'image-play-btn',
          text: '🎮 Play Game',
          size: { width: 120, height: 40 },
          image: this.images.playButton, // Use loaded image
          action: { type: 'game', handler: 'game.start' }
        },
        {
          id: 'image-debug-btn', 
          text: '🔧 Debug Mode',
          size: { width: 120, height: 40 },
          image: this.images.debugButton, // Use loaded image
          action: { type: 'debug', handler: 'debug.toggleGrid' }
        },
        {
          id: 'text-only-btn',
          text: '📝 Text Only',
          size: { width: 120, height: 35 },
          // No image - will render as text button
          action: { type: 'test', handler: 'test.textOnly' }
        },
        {
          id: 'image-options-btn',
          text: '⚙️ Options',
          size: { width: 120, height: 40 },
          image: this.images.optionsButton,
          action: { type: 'ui', handler: 'ui.showOptions' }
        }
      ]
    };

    return imageButtonConfig;
  },

  /**
   * Create a compact image-only button toolbar
   */
  createImageToolbar() {
    const toolbarConfig = {
      id: 'image-toolbar',
      name: 'Image Toolbar',
      layout: {
        type: 'horizontal',
        position: { x: 'center', y: 'top' },
        spacing: 8,
        padding: { top: 10, right: 15, bottom: 10, left: 15 }
      },
      appearance: {
        scale: 0.8,
        transparency: 0.9,
        visible: true,
        background: { color: [40, 40, 40, 180], cornerRadius: 15 }
      },
      behavior: {
        draggable: true,
        resizable: false,
        snapToEdges: true
      },
      buttons: [
        {
          id: 'toolbar-info',
          text: '', // No text for compact toolbar
          size: { width: 32, height: 32 },
          image: this.images.infoButton,
          action: { type: 'ui', handler: 'ui.showInfo' }
        },
        {
          id: 'toolbar-debug',
          text: '',
          size: { width: 32, height: 32 },
          image: this.images.debugButton,
          action: { type: 'debug', handler: 'debug.toggleGrid' }
        },
        {
          id: 'toolbar-options',
          text: '',
          size: { width: 32, height: 32 },
          image: this.images.optionsButton,
          action: { type: 'ui', handler: 'ui.showOptions' }
        }
      ]
    };

    return toolbarConfig;
  },

  /**
   * Create buttons with image backgrounds and text overlays
   */
  createHybridButtons() {
    const hybridConfig = {
      id: 'hybrid-buttons',
      name: 'Hybrid Image+Text Buttons',
      layout: {
        type: 'grid',
        position: { x: 'left', y: 'bottom' },
        gridColumns: 2,
        spacing: 10,
        padding: { top: 15, right: 15, bottom: 15, left: 15 }
      },
      appearance: {
        scale: 1.0,
        transparency: 1.0,
        visible: true,
        background: { color: [50, 50, 50, 220], cornerRadius: 8 }
      },
      behavior: {
        draggable: true,
        resizable: false,
        snapToEdges: false
      },
      buttons: [
        {
          id: 'hybrid-play',
          text: 'START',
          size: { width: 80, height: 50 },
          image: this.images.playButton,
          textColor: 'white',
          fontSize: 14,
          fontWeight: 'bold',
          action: { type: 'game', handler: 'game.start' }
        },
        {
          id: 'hybrid-exit',
          text: 'QUIT',
          size: { width: 80, height: 50 },
          image: this.images.exitButton,
          textColor: 'white',
          fontSize: 14,
          fontWeight: 'bold',
          action: { type: 'game', handler: 'game.exit' }
        }
      ]
    };

    return hybridConfig;
  },

  /**
   * Enhanced GameActionFactory initialization with image buttons
   */
  async initializeWithImageButtons() {
    try {
      // Load images first
      this.loadButtonImages();
      
      // Wait for images to load (in a real implementation, you'd use promises)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create configurations
      const configs = [
        this.createImageButtonGroup(),
        this.createImageToolbar(),
        this.createHybridButtons()
      ];
      
      // Initialize button groups
      await window.buttonGroupManager.initialize(configs);
      
      console.log('🎨 Image button system initialized successfully');
      console.log(`📊 Created ${configs.length} button groups with image support`);
      
    } catch (error) {
      console.error('❌ Failed to initialize image buttons:', error);
    }
  },

  /**
   * Action handlers for image buttons
   */
  registerImageButtonActions() {
    // Add to your GameActionFactory
    const imageButtonActions = {
      'game.start': () => {
        console.log('🎮 Starting game...');
        return { success: true, message: 'Game started' };
      },
      
      'game.exit': () => {
        console.log('👋 Exiting game...');
        return { success: true, message: 'Game exited' };
      },
      
      'ui.showOptions': () => {
        console.log('⚙️ Opening options menu...');
        window.g_renderLayerManager.toggleLayer('UI_OPTIONS');
        return { success: true, message: 'Options opened' };
      },
      
      'ui.showInfo': () => {
        console.log('ℹ️ Showing information...');
        return { success: true, message: 'Information displayed' };
      },
      
      'test.textOnly': () => {
        console.log('📝 Text-only button clicked');
        return { success: true, message: 'Text button works' };
      }
    };
    
    // Add these to your GameActionFactory handlers
    Object.assign(window.gameActionFactory.handlers || {}, imageButtonActions);
  }
};

/**
 * Example usage in your main game file:
 * 
 * // In preload():
 * ImageButtonExamples.loadButtonImages();
 * 
 * // In setup() or initialization:
 * ImageButtonExamples.registerImageButtonActions();
 * await ImageButtonExamples.initializeWithImageButtons();
 */

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImageButtonExamples;
}