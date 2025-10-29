/**
 * Unit Tests for FileMenuBar Component
 * Tests menu bar UI component for Level Editor file operations (Save/Load/New/Export)
 * 
 * TDD: Write tests FIRST, then implement FileMenuBar.js
 */

const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Load FileMenuBar class
const fileMenuBarCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/FileMenuBar.js'),
  'utf8'
);

// Execute in global context to define class
vm.runInThisContext(fileMenuBarCode);

describe('FileMenuBar', function() {
  let menuBar;
  let mockP5;
  
  beforeEach(function() {
    // Mock p5.js drawing functions
    mockP5 = {
      rect: sinon.stub(),
      fill: sinon.stub(),
      stroke: sinon.stub(),
      strokeWeight: sinon.stub(),
      text: sinon.stub(),
      textAlign: sinon.stub(),
      textSize: sinon.stub(),
      push: sinon.stub(),
      pop: sinon.stub(),
      noStroke: sinon.stub(),
      mouseX: 0,
      mouseY: 0,
      CENTER: 'center',
      LEFT: 'left'
    };
    
    // Assign to global for FileMenuBar to use
    global.rect = mockP5.rect;
    global.fill = mockP5.fill;
    global.stroke = mockP5.stroke;
    global.strokeWeight = mockP5.strokeWeight;
    global.text = mockP5.text;
    global.textAlign = mockP5.textAlign;
    global.textSize = mockP5.textSize;
    global.push = mockP5.push;
    global.pop = mockP5.pop;
    global.noStroke = mockP5.noStroke;
    global.mouseX = mockP5.mouseX;
    global.mouseY = mockP5.mouseY;
    global.CENTER = mockP5.CENTER;
    global.LEFT = mockP5.LEFT;
    
    // Sync to window for JSDOM
    if (typeof window !== 'undefined') {
      window.rect = global.rect;
      window.fill = global.fill;
      window.stroke = global.stroke;
      window.strokeWeight = global.strokeWeight;
      window.text = global.text;
      window.textAlign = global.textAlign;
      window.textSize = global.textSize;
      window.push = global.push;
      window.pop = global.pop;
      window.noStroke = global.noStroke;
      window.mouseX = global.mouseX;
      window.mouseY = global.mouseY;
      window.CENTER = global.CENTER;
      window.LEFT = global.LEFT;
    }
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Initialization', function() {
    it('should create menu bar with default position', function() {
      // This test will fail until we implement FileMenuBar
      // Expected: menu bar at top of screen (y=0)
      const menuBar = new FileMenuBar();
      
      expect(menuBar).to.exist;
      expect(menuBar.position.x).to.equal(0);
      expect(menuBar.position.y).to.equal(0);
    });
    
    it('should create menu bar with custom position', function() {
      const menuBar = new FileMenuBar({ x: 10, y: 20 });
      
      expect(menuBar.position.x).to.equal(10);
      expect(menuBar.position.y).to.equal(20);
    });
    
    it('should have default height of 40px', function() {
      const menuBar = new FileMenuBar();
      
      expect(menuBar.height).to.equal(40);
    });
    
    it('should initialize with default menu items', function() {
      const menuBar = new FileMenuBar();
      
      // Expected menu items: File, Edit, View
      expect(menuBar.menuItems).to.be.an('array');
      expect(menuBar.menuItems.length).to.be.greaterThan(0);
      
      // Should have at least "File" menu
      const fileMenu = menuBar.menuItems.find(item => item.label === 'File');
      expect(fileMenu).to.exist;
    });
  });
  
  describe('Menu Items', function() {
    it('should have File menu with Save/Load/New options', function() {
      const menuBar = new FileMenuBar();
      
      const fileMenu = menuBar.getMenuItem('File');
      expect(fileMenu).to.exist;
      expect(fileMenu.items).to.be.an('array');
      
      // Check for Save, Load, New options
      const saveOption = fileMenu.items.find(item => item.label === 'Save');
      const loadOption = fileMenu.items.find(item => item.label === 'Load');
      const newOption = fileMenu.items.find(item => item.label === 'New');
      
      expect(saveOption).to.exist;
      expect(loadOption).to.exist;
      expect(newOption).to.exist;
    });
    
    it('should have Edit menu with Undo/Redo options', function() {
      const menuBar = new FileMenuBar();
      
      const editMenu = menuBar.getMenuItem('Edit');
      expect(editMenu).to.exist;
      expect(editMenu.items).to.be.an('array');
      
      // Check for Undo, Redo
      const undoOption = editMenu.items.find(item => item.label === 'Undo');
      const redoOption = editMenu.items.find(item => item.label === 'Redo');
      
      expect(undoOption).to.exist;
      expect(redoOption).to.exist;
    });
    
    it('should support adding custom menu items', function() {
      const menuBar = new FileMenuBar();
      
      menuBar.addMenuItem({
        label: 'Custom',
        items: [
          { label: 'Custom Action', action: () => {} }
        ]
      });
      
      const customMenu = menuBar.getMenuItem('Custom');
      expect(customMenu).to.exist;
      expect(customMenu.label).to.equal('Custom');
    });
    
    it('should support keyboard shortcuts', function() {
      const menuBar = new FileMenuBar();
      const fileMenu = menuBar.getMenuItem('File');
      
      const saveOption = fileMenu.items.find(item => item.label === 'Save');
      expect(saveOption.shortcut).to.exist;
      expect(saveOption.shortcut).to.equal('Ctrl+S');
    });
  });
  
  describe('Rendering', function() {
    it('should render menu bar background', function() {
      const menuBar = new FileMenuBar();
      menuBar.render();
      
      // Should call rect() to draw background
      expect(mockP5.rect.called).to.be.true;
      expect(mockP5.fill.called).to.be.true;
    });
    
    it('should render all menu item labels', function() {
      const menuBar = new FileMenuBar();
      menuBar.render();
      
      // Should call text() for each menu item
      expect(mockP5.text.called).to.be.true;
      
      // Should render at least "File" text
      const textCalls = mockP5.text.getCalls();
      const fileTextCall = textCalls.find(call => call.args[0] === 'File');
      expect(fileTextCall).to.exist;
    });
    
    it('should highlight hovered menu item', function() {
      const menuBar = new FileMenuBar();
      
      // Simulate mouse over "File" menu
      global.mouseX = 30; // Assume File menu is at x=30
      global.mouseY = 20; // Middle of menu bar (height 40)
      
      menuBar.render();
      
      // Should render with highlight color
      expect(mockP5.fill.called).to.be.true;
    });
    
    it('should render dropdown when menu is open', function() {
      const menuBar = new FileMenuBar();
      
      // Open the File menu
      menuBar.openMenu('File');
      menuBar.render();
      
      // Should render dropdown background
      expect(mockP5.rect.callCount).to.be.greaterThan(1); // Background + dropdown
      
      // Should render dropdown items
      const textCalls = mockP5.text.getCalls();
      const saveTextCall = textCalls.find(call => call.args[0] === 'Save');
      expect(saveTextCall).to.exist;
    });
  });
  
  describe('Interaction', function() {
    it('should detect click on menu item', function() {
      const menuBar = new FileMenuBar();
      
      // Simulate click on "File" menu (assume x=30, y=20)
      const clicked = menuBar.handleClick(30, 20);
      
      expect(clicked).to.be.true;
      expect(menuBar.isMenuOpen('File')).to.be.true;
    });
    
    it('should execute action when dropdown option clicked', function() {
      const menuBar = new FileMenuBar();
      const saveCallback = sinon.stub();
      
      // Set custom save action
      const fileMenu = menuBar.getMenuItem('File');
      const saveOption = fileMenu.items.find(item => item.label === 'Save');
      saveOption.action = saveCallback;
      
      // Open menu (this will calculate positions)
      menuBar.openMenu('File');
      
      // Get the File menu position
      const menuPos = menuBar.menuPositions.find(p => p.label === 'File');
      
      // Click on Save option
      // "New" is at index 0, "Save" is at index 1
      // Dropdown starts at y = position.y + height = 0 + 40 = 40
      // Save item is at y = 40 + (1 * 30) = 70
      // Click in middle of item: y = 70 + 15 = 85... wait, or just within bounds
      const clickX = menuPos.x + 10; // Inside the dropdown
      const clickY = 40 + (1 * 30) + 15; // Middle of Save item
      
      menuBar.handleClick(clickX, clickY);
      
      expect(saveCallback.called).to.be.true;
    });
    
    it('should close dropdown when clicking elsewhere', function() {
      const menuBar = new FileMenuBar();
      
      // Open menu
      menuBar.openMenu('File');
      expect(menuBar.isMenuOpen('File')).to.be.true;
      
      // Click outside menu bar (y > 200)
      menuBar.handleClick(100, 300);
      
      expect(menuBar.isMenuOpen('File')).to.be.false;
    });
    
    it('should toggle menu on repeated clicks', function() {
      const menuBar = new FileMenuBar();
      
      // First click - open
      menuBar.handleClick(30, 20);
      expect(menuBar.isMenuOpen('File')).to.be.true;
      
      // Second click - close
      menuBar.handleClick(30, 20);
      expect(menuBar.isMenuOpen('File')).to.be.false;
    });
  });
  
  describe('State Management', function() {
    it('should open menu', function() {
      const menuBar = new FileMenuBar();
      
      menuBar.openMenu('File');
      
      expect(menuBar.isMenuOpen('File')).to.be.true;
      expect(menuBar.getOpenMenu()).to.equal('File');
    });
    
    it('should close menu', function() {
      const menuBar = new FileMenuBar();
      
      menuBar.openMenu('File');
      menuBar.closeMenu();
      
      expect(menuBar.isMenuOpen('File')).to.be.false;
      expect(menuBar.getOpenMenu()).to.be.null;
    });
    
    it('should close previous menu when opening new one', function() {
      const menuBar = new FileMenuBar();
      
      menuBar.openMenu('File');
      expect(menuBar.isMenuOpen('File')).to.be.true;
      
      menuBar.openMenu('Edit');
      expect(menuBar.isMenuOpen('File')).to.be.false;
      expect(menuBar.isMenuOpen('Edit')).to.be.true;
    });
    
    it('should enable/disable menu items', function() {
      const menuBar = new FileMenuBar();
      
      menuBar.setMenuItemEnabled('File', 'Save', false);
      
      const fileMenu = menuBar.getMenuItem('File');
      const saveOption = fileMenu.items.find(item => item.label === 'Save');
      
      expect(saveOption.enabled).to.be.false;
    });
    
    it('should not execute action when item is disabled', function() {
      const menuBar = new FileMenuBar();
      const saveCallback = sinon.stub();
      
      // Disable save
      menuBar.setMenuItemEnabled('File', 'Save', false);
      
      const fileMenu = menuBar.getMenuItem('File');
      const saveOption = fileMenu.items.find(item => item.label === 'Save');
      saveOption.action = saveCallback;
      
      // Try to execute
      menuBar.openMenu('File');
      menuBar.handleClick(30, 60); // Click save
      
      expect(saveCallback.called).to.be.false;
    });
  });
  
  describe('Keyboard Shortcuts', function() {
    it('should execute action on keyboard shortcut', function() {
      const menuBar = new FileMenuBar();
      const saveCallback = sinon.stub();
      
      // Set custom save action
      const fileMenu = menuBar.getMenuItem('File');
      const saveOption = fileMenu.items.find(item => item.label === 'Save');
      saveOption.action = saveCallback;
      
      // Trigger Ctrl+S
      menuBar.handleKeyPress('s', { ctrl: true });
      
      expect(saveCallback.called).to.be.true;
    });
    
    it('should not execute when modifier keys dont match', function() {
      const menuBar = new FileMenuBar();
      const saveCallback = sinon.stub();
      
      const fileMenu = menuBar.getMenuItem('File');
      const saveOption = fileMenu.items.find(item => item.label === 'Save');
      saveOption.action = saveCallback;
      
      // Press 's' without Ctrl
      menuBar.handleKeyPress('s', { ctrl: false });
      
      expect(saveCallback.called).to.be.false;
    });
  });
  
  describe('Hit Testing', function() {
    it('should detect if point is inside menu bar', function() {
      const menuBar = new FileMenuBar();
      
      expect(menuBar.containsPoint(100, 20)).to.be.true; // Inside
      expect(menuBar.containsPoint(100, 50)).to.be.false; // Below
    });
    
    it('should detect if point is inside dropdown', function() {
      const menuBar = new FileMenuBar();
      menuBar.openMenu('File');
      
      // Dropdown should extend below menu bar
      // File menu is at x=10, dropdown width=200, so x=10 to x=210
      expect(menuBar.containsPoint(30, 60)).to.be.true; // Inside dropdown (x=30 is between 10-210)
      expect(menuBar.containsPoint(220, 60)).to.be.false; // Outside dropdown (x=220 is > 210)
    });
  });
  
  describe('Styling', function() {
    it('should support custom background color', function() {
      const menuBar = new FileMenuBar({
        backgroundColor: [50, 50, 50]
      });
      
      expect(menuBar.style.backgroundColor).to.deep.equal([50, 50, 50]);
    });
    
    it('should support custom text color', function() {
      const menuBar = new FileMenuBar({
        textColor: [255, 255, 255]
      });
      
      expect(menuBar.style.textColor).to.deep.equal([255, 255, 255]);
    });
    
    it('should support custom hover color', function() {
      const menuBar = new FileMenuBar({
        hoverColor: [100, 100, 100]
      });
      
      expect(menuBar.style.hoverColor).to.deep.equal([100, 100, 100]);
    });
  });
  
  describe('Integration with Level Editor', function() {
    it('should integrate with LevelEditor save function', function() {
      const menuBar = new FileMenuBar();
      const mockLevelEditor = {
        save: sinon.stub(),
        load: sinon.stub(),
        undo: sinon.stub(),
        redo: sinon.stub()
      };
      
      menuBar.setLevelEditor(mockLevelEditor);
      
      // Trigger save
      const fileMenu = menuBar.getMenuItem('File');
      const saveOption = fileMenu.items.find(item => item.label === 'Save');
      saveOption.action();
      
      expect(mockLevelEditor.save.called).to.be.true;
    });
    
    it('should update Undo/Redo enabled state based on editor', function() {
      const menuBar = new FileMenuBar();
      const mockLevelEditor = {
        editor: {
          canUndo: sinon.stub().returns(false),
          canRedo: sinon.stub().returns(true)
        }
      };
      
      menuBar.setLevelEditor(mockLevelEditor);
      menuBar.updateMenuStates();
      
      const editMenu = menuBar.getMenuItem('Edit');
      const undoOption = editMenu.items.find(item => item.label === 'Undo');
      const redoOption = editMenu.items.find(item => item.label === 'Redo');
      
      expect(undoOption.enabled).to.be.false;
      expect(redoOption.enabled).to.be.true;
    });
  });
});
