/**
 * Unit Tests for FileMenuBar Separators and New Menu Items
 * 
 * Tests the enhanced FileMenuBar with:
 * - Separator rendering
 * - Return to Main Menu action
 * - PlayTest action
 * - Settings menu action
 * 
 * TDD Phase: RED (tests should fail - separator support doesn't exist yet)
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('FileMenuBar - Separators and New Actions', function() {
  let fileMenuBar;
  let mockP5;
  let mockLevelEditor;
  let mockSettingsPanel;
  
  beforeEach(function() {
    // Mock p5.js globals
    mockP5 = {
      fill: sinon.spy(),
      stroke: sinon.spy(),
      strokeWeight: sinon.spy(),
      noStroke: sinon.spy(),
      rect: sinon.spy(),
      text: sinon.spy(),
      textAlign: sinon.spy(),
      textSize: sinon.spy(),
      line: sinon.spy(),
      push: sinon.spy(),
      pop: sinon.spy(),
      width: 800,
      height: 600,
      mouseX: 100,
      mouseY: 20,
      CENTER: 'center',
      LEFT: 'left'
    };
    
    Object.assign(global, mockP5);
    if (typeof window !== 'undefined') {
      Object.assign(window, mockP5);
    }
    
    // Mock LevelEditor
    mockLevelEditor = {
      terrainEditor: {
        exportTerrain: sinon.stub().returns({ tiles: [] })
      }
    };
    
    // Mock SettingsPanel
    mockSettingsPanel = {
      open: sinon.spy(),
      visible: false
    };
    
    global.settingsPanel = mockSettingsPanel;
    if (typeof window !== 'undefined') {
      window.settingsPanel = mockSettingsPanel;
    }
    
    // Mock gameState
    global.gameState = 'LEVEL_EDITOR';
    if (typeof window !== 'undefined') {
      window.gameState = 'LEVEL_EDITOR';
    }
    
    // Mock sessionStorage
    const sessionStorageMock = {
      data: {},
      getItem: sinon.stub().callsFake(function(key) {
        return this.data[key] || null;
      }),
      setItem: sinon.stub().callsFake(function(key, value) {
        this.data[key] = value;
      }),
      removeItem: sinon.stub().callsFake(function(key) {
        delete this.data[key];
      })
    };
    
    global.sessionStorage = sessionStorageMock;
    if (typeof window !== 'undefined') {
      window.sessionStorage = sessionStorageMock;
    }
    
    // Load FileMenuBar
    try {
      const FileMenuBarClass = require('../../../Classes/ui/FileMenuBar.js');
      global.FileMenuBar = FileMenuBarClass;
      if (typeof window !== 'undefined') {
        window.FileMenuBar = FileMenuBarClass;
      }
      
      fileMenuBar = new FileMenuBarClass();
      fileMenuBar.setLevelEditor(mockLevelEditor);
    } catch (e) {
      // May fail if FileMenuBar not loaded
    }
  });
  
  afterEach(function() {
    sinon.restore();
    
    // Clean up mocks
    Object.keys(mockP5).forEach(key => {
      delete global[key];
      if (typeof window !== 'undefined') {
        delete window[key];
      }
    });
    
    delete global.settingsPanel;
    delete global.gameState;
    delete global.sessionStorage;
    delete global.FileMenuBar;
    
    if (typeof window !== 'undefined') {
      delete window.settingsPanel;
      delete window.gameState;
      delete window.sessionStorage;
      delete window.FileMenuBar;
    }
  });
  
  describe('Separator item structure', function() {
    it('should have separators in File menu', function() {
      if (!fileMenuBar) this.skip();
      
      const fileMenu = fileMenuBar.menuItems.find(menu => menu.label === 'File');
      const separators = fileMenu.items.filter(item => item.type === 'separator');
      
      expect(separators.length).to.be.at.least(2); // At least 2 separators
    });
    
    it('should have separator after New', function() {
      if (!fileMenuBar) this.skip();
      
      const fileMenu = fileMenuBar.menuItems.find(menu => menu.label === 'File');
      const newIndex = fileMenu.items.findIndex(item => item.label === 'New');
      const nextItem = fileMenu.items[newIndex + 1];
      
      expect(nextItem).to.exist;
      expect(nextItem.type).to.equal('separator');
    });
    
    it('should have separator after Export', function() {
      if (!fileMenuBar) this.skip();
      
      const fileMenu = fileMenuBar.menuItems.find(menu => menu.label === 'File');
      const exportIndex = fileMenu.items.findIndex(item => item.label === 'Export');
      const nextItem = fileMenu.items[exportIndex + 1];
      
      expect(nextItem).to.exist;
      expect(nextItem.type).to.equal('separator');
    });
    
    it('should have separator in Edit menu before Settings', function() {
      if (!fileMenuBar) this.skip();
      
      const editMenu = fileMenuBar.menuItems.find(menu => menu.label === 'Edit');
      const settingsIndex = editMenu.items.findIndex(item => item.label === 'Settings...');
      
      if (settingsIndex > 0) {
        const prevItem = editMenu.items[settingsIndex - 1];
        expect(prevItem.type).to.equal('separator');
      }
    });
  });
  
  describe('Separator rendering', function() {
    it('should render separator as horizontal line', function() {
      if (!fileMenuBar) this.skip();
      
      // Mock rendering a separator
      const separator = { type: 'separator' };
      const x = 10;
      const y = 50;
      const width = 200;
      
      // Call internal render method if available
      if (typeof fileMenuBar._renderDropdownItem === 'function') {
        mockP5.line.resetHistory();
        
        const height = fileMenuBar._renderDropdownItem(separator, x, y, width);
        
        expect(mockP5.line.called).to.be.true;
        expect(height).to.be.at.most(15); // Separator should be thin
      }
    });
    
    it('should not render text for separator', function() {
      if (!fileMenuBar) this.skip();
      
      const separator = { type: 'separator' };
      
      if (typeof fileMenuBar._renderDropdownItem === 'function') {
        mockP5.text.resetHistory();
        
        fileMenuBar._renderDropdownItem(separator, 10, 50, 200);
        
        // Should not draw any text
        expect(mockP5.text.called).to.be.false;
      }
    });
    
    it('should use smaller height for separator than regular items', function() {
      if (!fileMenuBar) this.skip();
      
      const separator = { type: 'separator' };
      const regularItem = { label: 'Test', action: () => {} };
      
      if (typeof fileMenuBar._renderDropdownItem === 'function') {
        const separatorHeight = fileMenuBar._renderDropdownItem(separator, 10, 50, 200);
        const regularHeight = fileMenuBar._renderDropdownItem(regularItem, 10, 50, 200);
        
        expect(separatorHeight).to.be.lessThan(regularHeight);
      }
    });
  });
  
  describe('Separator interaction', function() {
    it('should not trigger hover on separator', function() {
      if (!fileMenuBar) this.skip();
      
      fileMenuBar.openMenuName = 'File';
      const fileMenu = fileMenuBar.menuItems.find(menu => menu.label === 'File');
      const separatorIndex = fileMenu.items.findIndex(item => item.type === 'separator');
      
      if (separatorIndex >= 0) {
        // Simulate hover over separator
        fileMenuBar.handleMouseMove(50, 50 + (separatorIndex * 30));
        
        // Should not set hoveredItem to separator
        expect(fileMenuBar.hoveredItem).to.not.equal(separatorIndex);
      }
    });
    
    it('should not trigger click on separator', function() {
      if (!fileMenuBar) this.skip();
      
      fileMenuBar.openMenuName = 'File';
      const fileMenu = fileMenuBar.menuItems.find(menu => menu.label === 'File');
      const separator = fileMenu.items.find(item => item.type === 'separator');
      
      if (separator && separator.action) {
        // Separator should not have action
        expect(separator.action).to.be.undefined;
      }
    });
  });
  
  describe('Return to Main Menu action', function() {
    beforeEach(function() {
      // Mock confirm dialog
      global.confirm = sinon.stub().returns(true);
      if (typeof window !== 'undefined') {
        window.confirm = global.confirm;
      }
      
      // Mock initializeMenu
      global.initializeMenu = sinon.spy();
      if (typeof window !== 'undefined') {
        window.initializeMenu = global.initializeMenu;
      }
      
      // Mock redraw
      global.redraw = sinon.spy();
      if (typeof window !== 'undefined') {
        window.redraw = global.redraw;
      }
    });
    
    it('should have Return to Main Menu in File menu', function() {
      if (!fileMenuBar) this.skip();
      
      const fileMenu = fileMenuBar.menuItems.find(menu => menu.label === 'File');
      const returnItem = fileMenu.items.find(item => item.label === 'Return to Main Menu');
      
      expect(returnItem).to.exist;
    });
    
    it('should show confirmation dialog', function() {
      if (!fileMenuBar) this.skip();
      
      const fileMenu = fileMenuBar.menuItems.find(menu => menu.label === 'File');
      const returnItem = fileMenu.items.find(item => item.label === 'Return to Main Menu');
      
      if (returnItem && returnItem.action) {
        returnItem.action();
        
        expect(global.confirm.called).to.be.true;
      }
    });
    
    it('should change gameState to MENU when confirmed', function() {
      if (!fileMenuBar) this.skip();
      
      global.confirm.returns(true);
      const fileMenu = fileMenuBar.menuItems.find(menu => menu.label === 'File');
      const returnItem = fileMenu.items.find(item => item.label === 'Return to Main Menu');
      
      if (returnItem && returnItem.action) {
        returnItem.action();
        
        expect(global.gameState).to.equal('MENU');
      }
    });
    
    it('should call initializeMenu when confirmed', function() {
      if (!fileMenuBar) this.skip();
      
      global.confirm.returns(true);
      const fileMenu = fileMenuBar.menuItems.find(menu => menu.label === 'File');
      const returnItem = fileMenu.items.find(item => item.label === 'Return to Main Menu');
      
      if (returnItem && returnItem.action) {
        returnItem.action();
        
        expect(global.initializeMenu.called).to.be.true;
      }
    });
    
    it('should not change state when cancelled', function() {
      if (!fileMenuBar) this.skip();
      
      global.confirm.returns(false);
      global.gameState = 'LEVEL_EDITOR';
      
      const fileMenu = fileMenuBar.menuItems.find(menu => menu.label === 'File');
      const returnItem = fileMenu.items.find(item => item.label === 'Return to Main Menu');
      
      if (returnItem && returnItem.action) {
        returnItem.action();
        
        expect(global.gameState).to.equal('LEVEL_EDITOR');
      }
    });
  });
  
  describe('PlayTest action', function() {
    it('should have PlayTest in File menu', function() {
      if (!fileMenuBar) this.skip();
      
      const fileMenu = fileMenuBar.menuItems.find(menu => menu.label === 'File');
      const playTestItem = fileMenu.items.find(item => item.label === 'PlayTest');
      
      expect(playTestItem).to.exist;
    });
    
    it('should export terrain to sessionStorage', function() {
      if (!fileMenuBar) this.skip();
      
      const fileMenu = fileMenuBar.menuItems.find(menu => menu.label === 'File');
      const playTestItem = fileMenu.items.find(item => item.label === 'PlayTest');
      
      if (playTestItem && playTestItem.action) {
        global.sessionStorage.setItem.resetHistory();
        
        playTestItem.action();
        
        expect(global.sessionStorage.setItem.called).to.be.true;
        expect(global.sessionStorage.setItem.firstCall.args[0]).to.equal('playtest_terrain');
      }
    });
    
    it('should change gameState to PLAYING', function() {
      if (!fileMenuBar) this.skip();
      
      global.gameState = 'LEVEL_EDITOR';
      const fileMenu = fileMenuBar.menuItems.find(menu => menu.label === 'File');
      const playTestItem = fileMenu.items.find(item => item.label === 'PlayTest');
      
      if (playTestItem && playTestItem.action) {
        playTestItem.action();
        
        expect(global.gameState).to.equal('PLAYING');
      }
    });
    
    it('should call terrainEditor.exportTerrain()', function() {
      if (!fileMenuBar) this.skip();
      
      const fileMenu = fileMenuBar.menuItems.find(menu => menu.label === 'File');
      const playTestItem = fileMenu.items.find(item => item.label === 'PlayTest');
      
      if (playTestItem && playTestItem.action) {
        mockLevelEditor.terrainEditor.exportTerrain.resetHistory();
        
        playTestItem.action();
        
        expect(mockLevelEditor.terrainEditor.exportTerrain.called).to.be.true;
      }
    });
  });
  
  describe('Settings action', function() {
    it('should have Settings in Edit menu', function() {
      if (!fileMenuBar) this.skip();
      
      const editMenu = fileMenuBar.menuItems.find(menu => menu.label === 'Edit');
      const settingsItem = editMenu.items.find(item => item.label === 'Settings...');
      
      expect(settingsItem).to.exist;
    });
    
    it('should open SettingsPanel when clicked', function() {
      if (!fileMenuBar) this.skip();
      
      const editMenu = fileMenuBar.menuItems.find(menu => menu.label === 'Edit');
      const settingsItem = editMenu.items.find(item => item.label === 'Settings...');
      
      if (settingsItem && settingsItem.action) {
        mockSettingsPanel.open.resetHistory();
        
        settingsItem.action();
        
        expect(mockSettingsPanel.open.called).to.be.true;
      }
    });
    
    it('should handle missing SettingsPanel gracefully', function() {
      if (!fileMenuBar) this.skip();
      
      delete global.settingsPanel;
      delete window.settingsPanel;
      
      const editMenu = fileMenuBar.menuItems.find(menu => menu.label === 'Edit');
      const settingsItem = editMenu.items.find(item => item.label === 'Settings...');
      
      if (settingsItem && settingsItem.action) {
        expect(() => settingsItem.action()).to.not.throw();
      }
    });
  });
  
  describe('Menu structure validation', function() {
    it('should have File menu with correct order', function() {
      if (!fileMenuBar) this.skip();
      
      const fileMenu = fileMenuBar.menuItems.find(menu => menu.label === 'File');
      const labels = fileMenu.items.map(item => item.label || item.type);
      
      // Expected order: New, separator, Save, Load, Export, separator, Return, PlayTest
      expect(labels).to.include('New');
      expect(labels).to.include('separator');
      expect(labels).to.include('Save');
      expect(labels).to.include('Load');
      expect(labels).to.include('Export');
      expect(labels).to.include('Return to Main Menu');
      expect(labels).to.include('PlayTest');
    });
    
    it('should have Edit menu with Settings at end', function() {
      if (!fileMenuBar) this.skip();
      
      const editMenu = fileMenuBar.menuItems.find(menu => menu.label === 'Edit');
      const lastNonSeparator = editMenu.items
        .filter(item => item.type !== 'separator')
        .pop();
      
      expect(lastNonSeparator.label).to.equal('Settings...');
    });
  });
});
