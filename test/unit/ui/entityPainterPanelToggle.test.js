/**
 * Unit Tests: Entity Painter Panel Toggle
 * 
 * Tests that View menu Entity Painter toggle works correctly with draggablePanelManager
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('FileMenuBar - Entity Painter Panel Toggle', function() {
  let menuBar, mockLevelEditor, mockDraggablePanelManager;
  
  beforeEach(function() {
    // Mock p5.js functions
    global.textSize = sinon.stub();
    global.textWidth = sinon.stub().returns(100);
    global.fill = sinon.stub();
    global.noStroke = sinon.stub();
    global.rect = sinon.stub();
    global.text = sinon.stub();
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.stroke = sinon.stub();
    global.line = sinon.stub();
    
    // Mock window
    global.window = { width: 800, height: 600 };
    
    // Create FileMenuBar
    const FileMenuBar = require('../../../Classes/ui/FileMenuBar.js');
    menuBar = new FileMenuBar();
    
    // Create mock draggablePanelManager
    mockDraggablePanelManager = {
      togglePanel: sinon.stub(),
      isPanelVisible: sinon.stub().returns(false),
      getPanel: sinon.stub().returns({ visible: false })
    };
    
    // Create mock LevelEditor
    mockLevelEditor = {
      draggablePanelManager: mockDraggablePanelManager,
      notifications: {
        show: sinon.stub()
      }
    };
    
    // Set level editor
    menuBar.setLevelEditor(mockLevelEditor);
  });
  
  afterEach(function() {
    sinon.restore();
    delete global.textSize;
    delete global.textWidth;
    delete global.fill;
    delete global.noStroke;
    delete global.rect;
    delete global.text;
    delete global.push;
    delete global.pop;
    delete global.stroke;
    delete global.line;
    delete global.window;
  });
  
  describe('View Menu - Entity Painter Item', function() {
    it('should have Entity Painter item in View menu', function() {
      const viewMenu = menuBar.menuItems.find(m => m.label === 'View');
      expect(viewMenu).to.exist;
      
      const entityPainterItem = viewMenu.items.find(i => i.label === 'Entity Painter');
      expect(entityPainterItem).to.exist;
      expect(entityPainterItem.shortcut).to.equal('Ctrl+7');
      expect(entityPainterItem.checkable).to.be.true;
      expect(entityPainterItem.checked).to.be.false; // Hidden by default
    });
    
    it('should call _handleTogglePanel with entity-painter when clicked', function() {
      const viewMenu = menuBar.menuItems.find(m => m.label === 'View');
      const entityPainterItem = viewMenu.items.find(i => i.label === 'Entity Painter');
      
      const handleToggleSpy = sinon.spy(menuBar, '_handleTogglePanel');
      
      entityPainterItem.action();
      
      expect(handleToggleSpy.calledOnce).to.be.true;
      expect(handleToggleSpy.calledWith('entity-painter')).to.be.true;
    });
    
    it('should toggle entity-painter panel via draggablePanelManager', function() {
      const viewMenu = menuBar.menuItems.find(m => m.label === 'View');
      const entityPainterItem = viewMenu.items.find(i => i.label === 'Entity Painter');
      
      entityPainterItem.action();
      
      expect(mockDraggablePanelManager.togglePanel.calledOnce).to.be.true;
      expect(mockDraggablePanelManager.togglePanel.calledWith('entity-painter')).to.be.true;
    });
    
    it('should update checked state based on panel visibility', function() {
      const viewMenu = menuBar.menuItems.find(m => m.label === 'View');
      const entityPainterItem = viewMenu.items.find(i => i.label === 'Entity Painter');
      
      // Initially hidden
      mockDraggablePanelManager.isPanelVisible.returns(false);
      menuBar.updateViewMenuCheckStates();
      expect(entityPainterItem.checked).to.be.false;
      
      // After toggle (visible)
      mockDraggablePanelManager.isPanelVisible.returns(true);
      menuBar.updateViewMenuCheckStates();
      expect(entityPainterItem.checked).to.be.true;
    });
    
    it('should handle keyboard shortcut Ctrl+7', function() {
      const handleShortcutSpy = sinon.spy(menuBar, 'handleKeyPress');
      
      // Simulate Ctrl+7
      menuBar.handleKeyPress(55, true, false, false); // keyCode 55 = '7'
      
      expect(mockDraggablePanelManager.togglePanel.calledWith('entity-painter')).to.be.true;
    });
  });
  
  describe('Entity Painter Panel Integration', function() {
    it('should not error if draggablePanelManager is missing', function() {
      menuBar.setLevelEditor({
        notifications: { show: sinon.stub() }
      });
      
      const viewMenu = menuBar.menuItems.find(m => m.label === 'View');
      const entityPainterItem = viewMenu.items.find(i => i.label === 'Entity Painter');
      
      expect(() => entityPainterItem.action()).to.not.throw();
    });
    
    it('should not error if entity-painter panel does not exist yet', function() {
      mockDraggablePanelManager.getPanel.returns(null);
      
      const viewMenu = menuBar.menuItems.find(m => m.label === 'View');
      const entityPainterItem = viewMenu.items.find(i => i.label === 'Entity Painter');
      
      expect(() => entityPainterItem.action()).to.not.throw();
    });
  });
});
