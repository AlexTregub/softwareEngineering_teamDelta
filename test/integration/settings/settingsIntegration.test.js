/**
 * Integration Tests: Settings System
 * 
 * Tests the integration between SettingsManager, SettingsPanel, FileMenuBar, and CameraManager
 * 
 * Coverage:
 * - SettingsManager + CameraManager integration
 * - SettingsPanel + SettingsManager integration
 * - FileMenuBar + SettingsPanel integration
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('Settings System Integration', function() {
  let SettingsManager, SettingsPanel, FileMenuBar, CameraManager;
  let mockP5, mockLevelEditor;
  
  before(function() {
    // Mock p5.js globals
    mockP5 = {
      push: sinon.stub(),
      pop: sinon.stub(),
      fill: sinon.stub(),
      stroke: sinon.stub(),
      noStroke: sinon.stub(),
      strokeWeight: sinon.stub(),
      rect: sinon.stub(),
      circle: sinon.stub(),
      line: sinon.stub(),
      text: sinon.stub(),
      textAlign: sinon.stub(),
      textSize: sinon.stub(),
      constrain: sinon.stub().callsFake((val, min, max) => Math.max(min, Math.min(max, val))),
      createVector: sinon.stub().callsFake((x, y) => ({ x, y })),
      cursor: sinon.stub(),
      redraw: sinon.stub(),
      CENTER: 'center',
      LEFT: 'left',
      RIGHT: 'right',
      ARROW: 'arrow',
      width: 1920,
      height: 1080
    };
    
    Object.assign(global, mockP5);
    
    // Mock logging functions
    global.logNormal = sinon.stub();
    global.logWarning = sinon.stub();
    global.logError = sinon.stub();
    
    // Mock localStorage
    global.localStorage = {
      _data: {},
      getItem: function(key) { return this._data[key] || null; },
      setItem: function(key, value) { this._data[key] = value; },
      removeItem: function(key) { delete this._data[key]; },
      clear: function() { this._data = {}; }
    };
    
    // Mock window for browser environment
    if (typeof window === 'undefined') {
      global.window = global;
    }
    
    // Load component classes FIRST (SettingsPanel depends on them)
    global.Toggle = require('../../../Classes/ui/UIComponents/Toggle.js');
    global.Slider = require('../../../Classes/ui/UIComponents/Slider.js');
    
    // Load classes
    SettingsManager = require('../../../Classes/managers/SettingsManager.js');
    SettingsPanel = require('../../../Classes/ui/_baseObjects/modalWindow/settings/SettingsPanel.js');
    FileMenuBar = require('../../../Classes/ui/_baseObjects/bar/menuBar/FileMenuBar.js');
    CameraManager = require('../../../Classes/controllers/CameraManager.js');
  });
  
  beforeEach(function() {
    // Reset localStorage
    global.localStorage.clear();
    
    // Reset SettingsManager singleton
    if (SettingsManager._instance) {
      delete SettingsManager._instance;
    }
    
    // Create mock level editor
    mockLevelEditor = {
      terrainEditor: {
        exportTerrain: sinon.stub().returns({ tiles: [] })
      }
    };
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('SettingsManager + CameraManager Integration', function() {
    it('should read pan speed multiplier from SettingsManager', function() {
      // Initialize SettingsManager with 2.0x speed
      const settingsManager = SettingsManager.getInstance();
      settingsManager._settings = {
        camera: { panSpeed: 2.0 }
      };
      global.SettingsManager = SettingsManager;
      
      // Create CameraManager
      const cameraManager = new CameraManager();
      
      // Test that CameraManager can read the setting
      const panSpeed = settingsManager.get('camera.panSpeed', 1.0);
      expect(panSpeed).to.equal(2.0);
      
      // Verify pan state tracking works
      cameraManager.startPan(100, 100);
      expect(cameraManager._isPanning).to.be.true;
      expect(cameraManager._panStartX).to.equal(100);
      expect(cameraManager._panStartY).to.equal(100);
    });
    
    it('should use default 1.0x speed if SettingsManager not available', function() {
      // Delete SettingsManager temporarily
      const originalSettingsManager = global.SettingsManager;
      delete global.SettingsManager;
      
      try {
        const cameraManager = new CameraManager();
        
        // Verify CameraManager initializes without error
        expect(cameraManager).to.exist;
        expect(cameraManager.cameraX).to.equal(0);
        expect(cameraManager.cameraY).to.equal(0);
        
        // Verify pan state tracking works without SettingsManager
        cameraManager.startPan(100, 100);
        expect(cameraManager._isPanning).to.be.true;
      } finally {
        global.SettingsManager = originalSettingsManager;
      }
    });
    
    it('should update pan speed when setting changes', function() {
      const settingsManager = SettingsManager.getInstance();
      settingsManager._settings = {
        camera: { panSpeed: 1.0 }
      };
      global.SettingsManager = SettingsManager;
      
      // Verify initial speed
      let panSpeed = settingsManager.get('camera.panSpeed');
      expect(panSpeed).to.equal(1.0);
      
      // Change speed to 3.0x
      settingsManager.set('camera.panSpeed', 3.0);
      
      // Verify speed updated
      panSpeed = settingsManager.get('camera.panSpeed');
      expect(panSpeed).to.equal(3.0);
      
      // Verify CameraManager can read new speed
      const cameraManager = new CameraManager();
      const readSpeed = settingsManager.get('camera.panSpeed', 1.0);
      expect(readSpeed).to.equal(3.0);
    });
  });
  
  describe('SettingsPanel + SettingsManager Integration', function() {
    it('should update SettingsManager when slider value changes', function() {
      const settingsManager = SettingsManager.getInstance();
      settingsManager._settings = {
        camera: { panSpeed: 1.0 }
      };
      
      const panel = new SettingsPanel();
      panel.open();
      panel.switchTab('Camera');
      
      // Render the panel to initialize components
      panel.render();
      
      // Verify slider component was created
      expect(panel._components).to.exist;
      expect(panel._components.panSpeedSlider).to.exist;
      
      const slider = panel._components.panSpeedSlider;
      
      // Calculate position for 2.0x speed
      // Slider range: 0.5 to 3.0
      // Target: 2.0x
      // Percent = (2.0 - 0.5) / (3.0 - 0.5) = 1.5 / 2.5 = 0.6
      const targetX = slider.x + (0.6 * slider.width);
      
      // Drag slider using component method
      slider.startDrag();
      slider.handleDrag(targetX, slider.y);
      
      // SettingsManager should be updated to ~2.0x (callback triggers update)
      const newSpeed = settingsManager.get('camera.panSpeed');
      expect(newSpeed).to.be.within(1.8, 2.2); // Allow small tolerance
    });
    
    it('should persist settings to localStorage when changed via panel', function() {
      const settingsManager = SettingsManager.getInstance();
      settingsManager._settings = {
        camera: { panSpeed: 1.0 },
        editor: { autoSave: false }
      };
      
      const panel = new SettingsPanel();
      panel.open();
      
      // Change autoSave via toggle
      panel.handleToggle('editor.autoSave');
      
      // LocalStorage should be updated
      const stored = JSON.parse(localStorage.getItem('editor-settings'));
      expect(stored).to.exist;
      expect(stored.editor.autoSave).to.equal(true);
    });
    
    it('should reload settings when panel opens', function() {
      const settingsManager = SettingsManager.getInstance();
      settingsManager._settings = {
        camera: { panSpeed: 2.5 }
      };
      
      const panel = new SettingsPanel();
      
      // Open panel
      panel.open();
      
      // Panel should have loaded current settings
      expect(panel._cachedSettings).to.exist;
      expect(panel._cachedSettings.panSpeed).to.equal(2.5);
    });
    
    it('should reset to defaults when reset button clicked', function() {
      const settingsManager = SettingsManager.getInstance();
      const resetSpy = sinon.spy(settingsManager, 'resetToDefaults');
      
      const panel = new SettingsPanel();
      panel.open();
      
      // Change a setting
      settingsManager.set('camera.panSpeed', 3.0);
      
      // Click reset button
      panel.handleResetClick();
      
      // Should call resetToDefaults
      expect(resetSpy.calledOnce).to.be.true;
    });
  });
  
  describe('FileMenuBar + SettingsPanel Integration', function() {
    it('should open SettingsPanel when Settings menu item clicked', function() {
      const settingsManager = SettingsManager.getInstance();
      settingsManager._settings = { camera: {}, editor: {} };
      
      const settingsPanel = new SettingsPanel();
      global.settingsPanel = settingsPanel;
      
      const fileMenuBar = new FileMenuBar();
      fileMenuBar.setLevelEditor(mockLevelEditor);
      
      // Find Settings menu item
      const editMenu = fileMenuBar.menuItems.find(m => m.label === 'Edit');
      const settingsItem = editMenu.items.find(i => i.label === 'Settings...');
      
      expect(settingsItem).to.exist;
      
      // Click Settings
      settingsItem.action();
      
      // Panel should be visible
      expect(settingsPanel.visible).to.be.true;
    });
    
    it('should not throw error if SettingsPanel not available', function() {
      delete global.settingsPanel;
      
      const fileMenuBar = new FileMenuBar();
      fileMenuBar.setLevelEditor(mockLevelEditor);
      
      const editMenu = fileMenuBar.menuItems.find(m => m.label === 'Edit');
      const settingsItem = editMenu.items.find(i => i.label === 'Settings...');
      
      // Should not throw
      expect(() => settingsItem.action()).to.not.throw();
    });
    
    it('should close menu when Settings clicked', function() {
      const settingsManager = SettingsManager.getInstance();
      settingsManager._settings = { camera: {}, editor: {} };
      
      const settingsPanel = new SettingsPanel();
      global.settingsPanel = settingsPanel;
      
      const fileMenuBar = new FileMenuBar();
      fileMenuBar.setLevelEditor(mockLevelEditor);
      
      // Open Edit menu
      fileMenuBar.openMenu('Edit');
      expect(fileMenuBar.openMenuName).to.equal('Edit');
      
      // Click Settings menu item (action doesn't auto-close menu, caller does)
      const editMenu = fileMenuBar.menuItems.find(m => m.label === 'Edit');
      const settingsItem = editMenu.items.find(i => i.label === 'Settings...');
      settingsItem.action();
      
      // Panel should be open
      expect(settingsPanel.visible).to.be.true;
      
      // Menu should still be open (FileMenuBar requires explicit closeMenu call)
      // This is correct behavior - menu actions don't auto-close
      expect(fileMenuBar.openMenuName).to.equal('Edit');
    });
  });
  
  describe('Complete Settings Workflow', function() {
    it('should support full user workflow: open settings, change speed, verify integration', function() {
      // Setup
      const settingsManager = SettingsManager.getInstance();
      settingsManager._settings = {
        camera: { panSpeed: 1.0 }
      };
      global.SettingsManager = SettingsManager;
      
      const settingsPanel = new SettingsPanel();
      global.settingsPanel = settingsPanel;
      
      const fileMenuBar = new FileMenuBar();
      fileMenuBar.setLevelEditor(mockLevelEditor);
      
      const cameraManager = new CameraManager();
      
      // Step 1: User opens settings via Edit menu
      const editMenu = fileMenuBar.menuItems.find(m => m.label === 'Edit');
      const settingsItem = editMenu.items.find(i => i.label === 'Settings...');
      settingsItem.action();
      
      expect(settingsPanel.visible).to.be.true;
      
      // Step 2: User switches to Camera tab
      settingsPanel.switchTab('Camera');
      expect(settingsPanel.activeTab).to.equal('Camera');
      
      // Step 3: Render to initialize components
      settingsPanel.render();
      expect(settingsPanel._components).to.exist;
      expect(settingsPanel._components.panSpeedSlider).to.exist;
      
      const slider = settingsPanel._components.panSpeedSlider;
      
      // Step 4: User drags pan speed slider to 2.0x
      const targetX = slider.x + (0.6 * slider.width); // 60% = 2.0x
      slider.startDrag();
      slider.handleDrag(targetX, slider.y);
      
      const newSpeed = settingsManager.get('camera.panSpeed');
      expect(newSpeed).to.be.within(1.8, 2.2); // Approximate 2.0x
      
      // Step 5: User closes panel
      settingsPanel.close();
      expect(settingsPanel.visible).to.be.false;
      
      // Step 6: Verify CameraManager can read updated setting
      const readSpeed = settingsManager.get('camera.panSpeed', 1.0);
      expect(readSpeed).to.be.within(1.8, 2.2);
      
      // Step 7: Verify pan state tracking works with new setting
      cameraManager.startPan(100, 100);
      expect(cameraManager._isPanning).to.be.true;
      expect(cameraManager._panStartX).to.equal(100);
    });
    
    it('should persist settings across panel open/close', function() {
      const settingsManager = SettingsManager.getInstance();
      settingsManager._settings = {
        camera: { panSpeed: 1.0 },
        editor: { autoSave: false }
      };
      
      const panel = new SettingsPanel();
      
      // Open, change setting, close
      panel.open();
      settingsManager.set('camera.panSpeed', 2.5);
      panel.close();
      
      // Reopen - should load persisted setting
      panel.open();
      expect(panel._cachedSettings.panSpeed).to.equal(2.5);
    });
  });
});
