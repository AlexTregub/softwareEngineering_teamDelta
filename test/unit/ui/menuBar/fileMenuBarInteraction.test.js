/**
 * Unit Tests: FileMenuBar Interaction (Bug Fix #3)
 * 
 * Tests for proper menu bar click handling when dropdown is open
 * 
 * TDD: Write tests FIRST, then fix the bug
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../../helpers/uiTestHelpers');

// Load FileMenuBar
const FileMenuBar = require('../../../../Classes/ui/FileMenuBar.js');

describe('FileMenuBar - Interaction Bug Fix', function() {
  let menuBar;
  
  beforeEach(function() {
    setupUITestEnvironment();
    menuBar = new FileMenuBar({ x: 0, y: 0, height: 40 });
  });
  
  afterEach(function() {
    cleanupUITestEnvironment();
  });
  
  describe('Menu Bar Clickability When Dropdown Open', function() {
    it('should handle clicks on menu bar even when dropdown is open', function() {
      // Force calculation of menu positions (normally done on first render)
      menuBar._calculateMenuPositions();
      
      // Open File menu
      menuBar.openMenu('File');
      expect(menuBar.openMenuName).to.equal('File');
      
      // Click on Edit menu (should switch to Edit dropdown)
      // File: x=10, width=52 (4*8+20), ends at 62
      // Edit: starts at x=62
      const editX = 70; // Inside Edit menu bounds
      const barY = 20; // Middle of menu bar
      
      const handled = menuBar.handleClick(editX, barY);
      
      expect(handled).to.be.true;
      expect(menuBar.openMenuName).to.equal('Edit'); // Should switch to Edit
    });
    
    it('should handle clicks on dropdown items when dropdown is open', function() {
      // Force calculation of menu positions
      menuBar._calculateMenuPositions();
      
      // Open File menu
      menuBar.openMenu('File');
      
      // Mock action for first item (New)
      const newAction = sinon.spy();
      menuBar.menuItems[0].items[0].action = newAction;
      
      // Click on first dropdown item (New)
      const itemX = 10; // Left edge of dropdown
      const itemY = 50; // First item in dropdown
      
      const handled = menuBar.handleClick(itemX, itemY);
      
      expect(handled).to.be.true;
      expect(newAction.called).to.be.true;
      expect(menuBar.openMenuName).to.be.null; // Menu should close after action
    });
    
    it('should close dropdown when clicking outside menu area', function() {
      // Force calculation of menu positions
      menuBar._calculateMenuPositions();
      
      // Open File menu
      menuBar.openMenu('File');
      expect(menuBar.openMenuName).to.equal('File');
      
      // Click outside menu bar (on canvas)
      const canvasX = 400;
      const canvasY = 300;
      
      const handled = menuBar.handleClick(canvasX, canvasY);
      
      expect(handled).to.be.true; // Click consumed by closing menu
      expect(menuBar.openMenuName).to.be.null; // Menu should close
    });
    
    it('should remain clickable after opening and closing dropdown', function() {
      // Force calculation of menu positions
      menuBar._calculateMenuPositions();
      
      // Open File menu
      menuBar.openMenu('File');
      
      // Close menu
      menuBar.closeMenu();
      
      // Click on Edit menu (should work normally)
      const editX = 70; // Inside Edit menu bounds
      const barY = 20;
      
      const handled = menuBar.handleClick(editX, barY);
      
      expect(handled).to.be.true;
      expect(menuBar.openMenuName).to.equal('Edit');
    });
  });
  
  describe('Input Consumption Priority', function() {
    it('should return true when handling menu bar clicks', function() {
      const barX = 10;
      const barY = 20;
      
      const handled = menuBar.handleClick(barX, barY);
      
      expect(handled).to.be.true; // Consumed
    });
    
    it('should return true when handling dropdown clicks', function() {
      menuBar.openMenu('File');
      
      const itemX = 10;
      const itemY = 50;
      
      const handled = menuBar.handleClick(itemX, itemY);
      
      expect(handled).to.be.true; // Consumed
    });
    
    it('should return true when closing menu via outside click', function() {
      menuBar.openMenu('File');
      
      const outsideX = 400;
      const outsideY = 300;
      
      const handled = menuBar.handleClick(outsideX, outsideY);
      
      expect(handled).to.be.true; // Consumed (closing menu)
    });
    
    it('should return false when click is not on menu bar and menu is closed', function() {
      const outsideX = 400;
      const outsideY = 300;
      
      const handled = menuBar.handleClick(outsideX, outsideY);
      
      expect(handled).to.be.false; // Not consumed
    });
  });
  
  describe('Menu State Notifications', function() {
    it('should notify LevelEditor when menu opens', function() {
      const mockLevelEditor = {
        setMenuOpen: sinon.spy()
      };
      
      menuBar.setLevelEditor(mockLevelEditor);
      menuBar.openMenu('File');
      
      expect(mockLevelEditor.setMenuOpen.calledWith(true)).to.be.true;
    });
    
    it('should notify LevelEditor when menu closes', function() {
      const mockLevelEditor = {
        setMenuOpen: sinon.spy()
      };
      
      menuBar.setLevelEditor(mockLevelEditor);
      menuBar.openMenu('File');
      menuBar.closeMenu();
      
      expect(mockLevelEditor.setMenuOpen.calledWith(false)).to.be.true;
    });
  });
});
