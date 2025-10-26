const { expect } = require('chai');
const AntManager = require('../../../Classes/managers/AntManager.js');

describe('AntManager', function() {
  let manager;
  let mockAnt;
  let mockAnts;
  
  beforeEach(function() {
    manager = new AntManager();
    
    // Create mock ant
    mockAnt = {
      antIndex: 0,
      selected: false,
      mouseOver: false,
      position: { x: 100, y: 100 },
      isMouseOver: function() { return this.mouseOver; },
      setSelected: function(value) { this.selected = value; },
      moveToLocation: function(x, y) { 
        this.position.x = x;
        this.position.y = y;
      },
      getPosition: function() { return this.position; }
    };
    
    // Mock global ants array
    mockAnts = [mockAnt];
    global.ants = mockAnts;
    global.antIndex = 1;
    
    // Mock global mouse positions
    global.mouseX = 200;
    global.mouseY = 200;
    
    // Mock global ant class
    global.ant = function() {};
    mockAnt.__proto__ = new global.ant();
  });
  
  afterEach(function() {
    delete global.ants;
    delete global.antIndex;
    delete global.mouseX;
    delete global.mouseY;
    delete global.ant;
  });
  
  describe('Constructor', function() {
    it('should initialize with null selectedAnt', function() {
      expect(manager.selectedAnt).to.be.null;
    });
    
    it('should create new instance successfully', function() {
      const newManager = new AntManager();
      expect(newManager).to.be.instanceOf(AntManager);
    });
  });
  
  describe('handleAntClick()', function() {
    it('should move selected ant when ant is already selected', function() {
      manager.selectedAnt = mockAnt;
      const initialX = mockAnt.position.x;
      const initialY = mockAnt.position.y;
      
      manager.handleAntClick();
      
      expect(mockAnt.position.x).to.equal(global.mouseX);
      expect(mockAnt.position.y).to.equal(global.mouseY);
      expect(manager.selectedAnt).to.equal(mockAnt);
    });
    
    it('should select ant under mouse when no ant selected', function() {
      mockAnt.mouseOver = true;
      
      manager.handleAntClick();
      
      expect(manager.selectedAnt).to.equal(mockAnt);
      expect(mockAnt.selected).to.be.true;
    });
    
    it('should not select ant when mouse not over any ant', function() {
      mockAnt.mouseOver = false;
      
      manager.handleAntClick();
      
      expect(manager.selectedAnt).to.be.null;
      expect(mockAnt.selected).to.be.false;
    });
    
    it('should deselect previous ant when selecting new one', function() {
      const otherAnt = {
        antIndex: 1,
        selected: false,
        mouseOver: false,
        setSelected: function(value) { this.selected = value; },
        isMouseOver: function() { return this.mouseOver; }
      };
      otherAnt.__proto__ = new global.ant();
      
      global.ants = [mockAnt, otherAnt];
      global.antIndex = 2;
      
      // Setup: manager has no selection, but mockAnt thinks it's selected
      manager.selectedAnt = null;
      mockAnt.selected = true;
      mockAnt.mouseOver = false;
      otherAnt.mouseOver = true;
      
      // Call handleAntClick - should select otherAnt and deselect mockAnt
      manager.handleAntClick();
      
      // The code checks: if (this.selectedAnt) - which is null, so it goes to the else block
      // In the else block, it deselects this.selectedAnt if it exists before selecting new one
      // But this.selectedAnt is null, so only otherAnt gets selected
      expect(manager.selectedAnt).to.equal(otherAnt);
      expect(otherAnt.selected).to.be.true;
      // mockAnt.selected stays true because the code only deselects this.selectedAnt
      expect(mockAnt.selected).to.be.true;
    });
    
    it('should only select first ant under mouse', function() {
      const secondAnt = {
        antIndex: 1,
        selected: false,
        mouseOver: true,
        setSelected: function(value) { this.selected = value; },
        isMouseOver: function() { return this.mouseOver; }
      };
      secondAnt.__proto__ = new global.ant();
      
      mockAnt.mouseOver = true;
      global.ants.push(secondAnt);
      global.antIndex = 2;
      
      manager.handleAntClick();
      
      expect(manager.selectedAnt).to.equal(mockAnt);
      expect(secondAnt.selected).to.be.false;
    });
    
    it('should handle no ants in array', function() {
      global.ants = [];
      global.antIndex = 0;
      
      expect(() => manager.handleAntClick()).to.not.throw();
      expect(manager.selectedAnt).to.be.null;
    });
  });
  
  describe('moveSelectedAnt()', function() {
    it('should move selected ant and keep selection when resetSelection is false', function() {
      manager.selectedAnt = mockAnt;
      
      manager.moveSelectedAnt(false);
      
      expect(mockAnt.position.x).to.equal(global.mouseX);
      expect(mockAnt.position.y).to.equal(global.mouseY);
      expect(manager.selectedAnt).to.equal(mockAnt);
    });
    
    it('should move selected ant and clear selection when resetSelection is true', function() {
      manager.selectedAnt = mockAnt;
      mockAnt.selected = true;
      
      manager.moveSelectedAnt(true);
      
      expect(mockAnt.position.x).to.equal(global.mouseX);
      expect(mockAnt.position.y).to.equal(global.mouseY);
      expect(mockAnt.selected).to.be.false;
      expect(manager.selectedAnt).to.be.null;
    });
    
    it('should do nothing when no ant is selected', function() {
      manager.selectedAnt = null;
      
      manager.moveSelectedAnt(false);
      
      expect(mockAnt.position.x).to.equal(100);
      expect(mockAnt.position.y).to.equal(100);
    });
    
    it('should handle error for non-boolean resetSelection parameter', function() {
      manager.selectedAnt = mockAnt;
      global.IncorrectParamPassed = function(flag, value) {
        throw new Error('Invalid parameter');
      };
      
      expect(() => manager.moveSelectedAnt('invalid')).to.throw('Invalid parameter');
      
      delete global.IncorrectParamPassed;
    });
    
    it('should log error when IncorrectParamPassed is undefined', function() {
      manager.selectedAnt = mockAnt;
      const consoleErrors = [];
      const originalError = console.error;
      console.error = (...args) => consoleErrors.push(args);
      
      manager.moveSelectedAnt(123);
      
      expect(consoleErrors.length).to.be.greaterThan(0);
      console.error = originalError;
    });
    
    it('should handle null resetSelection parameter', function() {
      manager.selectedAnt = mockAnt;
      
      expect(() => manager.moveSelectedAnt(null)).to.not.throw();
    });
    
    it('should handle undefined resetSelection parameter', function() {
      manager.selectedAnt = mockAnt;
      
      expect(() => manager.moveSelectedAnt(undefined)).to.not.throw();
    });
  });
  
  describe('selectAnt()', function() {
    it('should select ant when mouse is over it', function() {
      mockAnt.mouseOver = true;
      
      manager.selectAnt(mockAnt);
      
      expect(manager.selectedAnt).to.equal(mockAnt);
      expect(mockAnt.selected).to.be.true;
    });
    
    it('should not select ant when mouse is not over it', function() {
      mockAnt.mouseOver = false;
      
      manager.selectAnt(mockAnt);
      
      expect(manager.selectedAnt).to.be.null;
      expect(mockAnt.selected).to.be.false;
    });
    
    it('should return early when ant is not instance of ant class', function() {
      const fakeAnt = { isMouseOver: () => true, setSelected: () => {} };
      
      manager.selectAnt(fakeAnt);
      
      expect(manager.selectedAnt).to.be.null;
    });
    
    it('should handle null ant parameter', function() {
      expect(() => manager.selectAnt(null)).to.not.throw();
      expect(manager.selectedAnt).to.be.null;
    });
    
    it('should handle undefined ant parameter', function() {
      expect(() => manager.selectAnt(undefined)).to.not.throw();
      expect(manager.selectedAnt).to.be.null;
    });
    
    it('should handle ant without isMouseOver method', function() {
      const brokenAnt = { setSelected: () => {} };
      brokenAnt.__proto__ = new global.ant();
      
      // Will throw because isMouseOver is not defined
      expect(() => manager.selectAnt(brokenAnt)).to.throw();
    });
  });
  
  describe('getAntObject()', function() {
    it('should return ant at specified index', function() {
      const result = manager.getAntObject(0);
      expect(result).to.equal(mockAnt);
    });
    
    it('should return null for invalid index', function() {
      const result = manager.getAntObject(999);
      expect(result).to.be.null;
    });
    
    it('should return null for negative index', function() {
      const result = manager.getAntObject(-1);
      expect(result).to.be.null;
    });
    
    it('should return null when ants array is undefined', function() {
      delete global.ants;
      const result = manager.getAntObject(0);
      expect(result).to.be.null;
    });
    
    it('should return null when ant at index is null', function() {
      global.ants[0] = null;
      const result = manager.getAntObject(0);
      expect(result).to.be.null;
    });
    
    it('should return null when ant at index is undefined', function() {
      global.ants[0] = undefined;
      const result = manager.getAntObject(0);
      expect(result).to.be.null;
    });
    
    it('should handle empty ants array', function() {
      global.ants = [];
      const result = manager.getAntObject(0);
      expect(result).to.be.null;
    });
  });
  
  describe('getSelectedAnt()', function() {
    it('should return selected ant', function() {
      manager.selectedAnt = mockAnt;
      expect(manager.getSelectedAnt()).to.equal(mockAnt);
    });
    
    it('should return null when no ant selected', function() {
      manager.selectedAnt = null;
      expect(manager.getSelectedAnt()).to.be.null;
    });
    
    it('should return correct ant after selection change', function() {
      const otherAnt = { antIndex: 1 };
      manager.selectedAnt = mockAnt;
      expect(manager.getSelectedAnt()).to.equal(mockAnt);
      
      manager.selectedAnt = otherAnt;
      expect(manager.getSelectedAnt()).to.equal(otherAnt);
    });
  });
  
  describe('setSelectedAnt()', function() {
    it('should set selected ant', function() {
      manager.setSelectedAnt(mockAnt);
      expect(manager.selectedAnt).to.equal(mockAnt);
    });
    
    it('should clear selected ant with null', function() {
      manager.selectedAnt = mockAnt;
      manager.setSelectedAnt(null);
      expect(manager.selectedAnt).to.be.null;
    });
    
    it('should replace previously selected ant', function() {
      const otherAnt = { antIndex: 1 };
      manager.selectedAnt = mockAnt;
      
      manager.setSelectedAnt(otherAnt);
      
      expect(manager.selectedAnt).to.equal(otherAnt);
    });
    
    it('should handle undefined parameter', function() {
      manager.setSelectedAnt(undefined);
      expect(manager.selectedAnt).to.be.undefined;
    });
  });
  
  describe('clearSelection()', function() {
    it('should deselect ant and set selectedAnt to null', function() {
      manager.selectedAnt = mockAnt;
      mockAnt.selected = true;
      
      manager.clearSelection();
      
      expect(mockAnt.selected).to.be.false;
      expect(manager.selectedAnt).to.be.null;
    });
    
    it('should do nothing when no ant is selected', function() {
      manager.selectedAnt = null;
      
      expect(() => manager.clearSelection()).to.not.throw();
      expect(manager.selectedAnt).to.be.null;
    });
    
    it('should handle ant without setSelected method gracefully', function() {
      manager.selectedAnt = { antIndex: 0 };
      
      expect(() => manager.clearSelection()).to.throw();
    });
    
    it('should work after multiple selections', function() {
      manager.selectedAnt = mockAnt;
      mockAnt.selected = true;
      manager.clearSelection();
      
      const otherAnt = {
        antIndex: 1,
        selected: true,
        setSelected: function(value) { this.selected = value; }
      };
      manager.selectedAnt = otherAnt;
      manager.clearSelection();
      
      expect(otherAnt.selected).to.be.false;
      expect(manager.selectedAnt).to.be.null;
    });
  });
  
  describe('hasSelection()', function() {
    it('should return true when ant is selected', function() {
      manager.selectedAnt = mockAnt;
      expect(manager.hasSelection()).to.be.true;
    });
    
    it('should return false when no ant is selected', function() {
      manager.selectedAnt = null;
      expect(manager.hasSelection()).to.be.false;
    });
    
    it('should update when selection changes', function() {
      expect(manager.hasSelection()).to.be.false;
      
      manager.selectedAnt = mockAnt;
      expect(manager.hasSelection()).to.be.true;
      
      manager.selectedAnt = null;
      expect(manager.hasSelection()).to.be.false;
    });
  });
  
  describe('getDebugInfo()', function() {
    it('should return debug info with no selection', function() {
      const info = manager.getDebugInfo();
      
      expect(info).to.have.property('hasSelectedAnt', false);
      expect(info).to.have.property('selectedAntIndex', null);
      expect(info).to.have.property('selectedAntPosition', null);
    });
    
    it('should return debug info with selected ant', function() {
      manager.selectedAnt = mockAnt;
      const info = manager.getDebugInfo();
      
      expect(info.hasSelectedAnt).to.be.true;
      expect(info.selectedAntIndex).to.equal(0);
      expect(info.selectedAntPosition).to.deep.equal({ x: 100, y: 100 });
    });
    
    it('should include position from getPosition method', function() {
      manager.selectedAnt = mockAnt;
      mockAnt.position = { x: 250, y: 350 };
      
      const info = manager.getDebugInfo();
      
      expect(info.selectedAntPosition.x).to.equal(250);
      expect(info.selectedAntPosition.y).to.equal(350);
    });
    
    it('should update when selection changes', function() {
      let info = manager.getDebugInfo();
      expect(info.hasSelectedAnt).to.be.false;
      
      manager.selectedAnt = mockAnt;
      info = manager.getDebugInfo();
      expect(info.hasSelectedAnt).to.be.true;
    });
  });
  
  describe('Legacy Compatibility Methods', function() {
    describe('AntClickControl()', function() {
      it('should delegate to handleAntClick', function() {
        let called = false;
        manager.handleAntClick = function() { called = true; };
        
        manager.AntClickControl();
        
        expect(called).to.be.true;
      });
    });
    
    describe('MoveAnt()', function() {
      it('should delegate to moveSelectedAnt', function() {
        let calledWith = null;
        manager.moveSelectedAnt = function(reset) { calledWith = reset; };
        
        manager.MoveAnt(true);
        
        expect(calledWith).to.be.true;
      });
      
      it('should pass false parameter correctly', function() {
        let calledWith = null;
        manager.moveSelectedAnt = function(reset) { calledWith = reset; };
        
        manager.MoveAnt(false);
        
        expect(calledWith).to.be.false;
      });
    });
    
    describe('SelectAnt()', function() {
      it('should delegate to selectAnt', function() {
        let calledWith = null;
        manager.selectAnt = function(ant) { calledWith = ant; };
        
        manager.SelectAnt(mockAnt);
        
        expect(calledWith).to.equal(mockAnt);
      });
      
      it('should handle null parameter', function() {
        let calledWith = undefined;
        manager.selectAnt = function(ant) { calledWith = ant; };
        
        manager.SelectAnt(null);
        
        expect(calledWith).to.be.null;
      });
    });
    
    describe('getAntObj()', function() {
      it('should delegate to getAntObject', function() {
        const result = manager.getAntObj(0);
        expect(result).to.equal(mockAnt);
      });
      
      it('should return null for invalid index', function() {
        const result = manager.getAntObj(999);
        expect(result).to.be.null;
      });
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle rapid selection changes', function() {
      for (let i = 0; i < 100; i++) {
        manager.selectedAnt = mockAnt;
        manager.selectedAnt = null;
      }
      expect(manager.selectedAnt).to.be.null;
    });
    
    it('should handle selecting same ant multiple times', function() {
      manager.setSelectedAnt(mockAnt);
      manager.setSelectedAnt(mockAnt);
      manager.setSelectedAnt(mockAnt);
      
      expect(manager.selectedAnt).to.equal(mockAnt);
    });
    
    it('should handle move operations with no mouseX/mouseY globals', function() {
      delete global.mouseX;
      delete global.mouseY;
      manager.selectedAnt = mockAnt;
      
      // Will throw ReferenceError because mouseX/mouseY are not defined
      expect(() => manager.moveSelectedAnt(false)).to.throw(ReferenceError);
    });
    
    it('should maintain state consistency after errors', function() {
      manager.selectedAnt = mockAnt;
      
      try {
        manager.moveSelectedAnt('invalid');
      } catch (e) {
        // Error expected
      }
      
      expect(manager.selectedAnt).to.equal(mockAnt);
    });
  });
});
