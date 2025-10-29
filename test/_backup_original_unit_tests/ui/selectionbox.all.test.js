const { expect } = require('chai');

// Minimal browser/p5 shims so SelectionBoxController can load in Node
global.window = global;
global.createVector = function (x, y) {
  return { x: x, y: y, copy: function () { return { x: this.x, y: this.y, copy: this.copy }; } };
};
global.dist = function (x1, y1, x2, y2) { const dx = x2 - x1, dy = y2 - y1; return Math.sqrt(dx*dx + dy*dy); };
// No-op graphics helpers used by draw()
['push','pop','rect','line','stroke','strokeWeight','noFill','fill','textSize','textAlign','text','redraw','noStroke'].forEach(fn => global[fn] = function(){});

// Basic globals used by the controller
global.TILE_SIZE = 16;
global.cameraX = 0;
global.cameraY = 0;

describe('Selection box consolidated tests', function() {
  describe('SelectionBoxController (browser controller)', function() {
    let Controller;
    before(function() {
      // Load the controller IIFE which attaches to window
      // If it has been loaded already by other tests, this is harmless
      try {
        require('../../Classes/controllers/SelectionBoxController.js');
      } catch (err) {
        // If requiring fails, rethrow so tests fail explicitly
        throw err;
      }
      Controller = global.SelectionBoxController;
      if (!Controller) throw new Error('SelectionBoxController not found on global/window');
    });

    it('exposes static helpers isEntityInBox and isEntityUnderMouse', function() {
      const ent = { posX: 10, posY: 10, sizeX: 10, sizeY: 10 };
      expect(Controller.isEntityUnderMouse(ent, 12, 12)).to.be.true;
      expect(Controller.isEntityUnderMouse(ent, 0, 0)).to.be.false;
      expect(Controller.isEntityInBox(ent, 5, 20, 5, 20)).to.be.true;
    });

    it('can be instantiated via getInstance and set/get entities', function() {
      const instA = Controller.getInstance(null, []);
      const instB = Controller.getInstance(null, []);
      expect(instA).to.equal(instB);
      instA.setEntities([{ posX:0,posY:0,sizeX:4,sizeY:4 }]);
      expect(instA.getEntities()).to.be.an('array').with.lengthOf(1);
    });

    it('supports enable/disable and config update/get', function() {
      const ctrl = Controller.getInstance();
      ctrl.setEnabled(false);
      expect(ctrl.isEnabled()).to.be.false;
      ctrl.setEnabled(true);
      expect(ctrl.isEnabled()).to.be.true;
      const orig = ctrl.getConfig();
      ctrl.updateConfig({ dragThreshold: 999 });
      expect(ctrl.getConfig().dragThreshold).to.equal(999);
      // restore
      ctrl.updateConfig(orig);
    });

    it('selects a single entity on click and reports via getSelectedEntities', function() {
      const e1 = { posX: 10, posY: 10, sizeX: 10, sizeY: 10, isSelected: false };
      const e2 = { posX: 100, posY: 100, sizeX: 10, sizeY: 10, isSelected: false };
  const ctrl = Controller.getInstance();
  // Ensure controller uses our entities for this test
  ctrl.setEntities([e1, e2]);
  // Ensure nothing selected
  ctrl.deselectAll();
      ctrl.handleClick(12, 12, 'left');
      const sel = ctrl.getSelectedEntities();
      expect(sel).to.be.an('array').with.lengthOf(1);
      expect(sel[0]).to.equal(e1);
      expect(e1.isSelected).to.be.true;
      // deselect
      ctrl.deselectAll();
      expect(ctrl.getSelectedEntities()).to.have.lengthOf(0);
    });

    it('performs box selection via click+drag+release respecting dragThreshold', function() {
      const a = { posX: 50, posY: 50, sizeX: 10, sizeY: 10, isSelected:false, isBoxHovered:false };
      const b = { posX: 200, posY: 200, sizeX: 10, sizeY: 10, isSelected:false, isBoxHovered:false };
  const ctrl = Controller.getInstance();
  // Ensure controller uses our entities for this test
  ctrl.setEntities([a, b]);
  // start selection by clicking empty space
  ctrl.deselectAll();
      ctrl.handleClick(0, 0, 'left');
      // drag to include 'a'
      ctrl.handleDrag(60, 60);
      // release to finalize
      ctrl.handleRelease(60, 60, 'left');
      const sel = ctrl.getSelectedEntities();
      expect(sel).to.be.an('array');
      expect(sel.some(e => e === a)).to.be.true;
      // ensure b is not selected
      expect(sel.some(e => e === b)).to.be.false;
      // cleanup
      ctrl.deselectAll();
    });

    it('invokes onSelectionEnd callback when setCallbacks provided', function(done) {
      const ent = { posX: 5, posY: 5, sizeX: 2, sizeY: 2 };
  const ctrl = Controller.getInstance();
  // Ensure controller uses our entities for this test
  ctrl.setEntities([ent]);
  ctrl.deselectAll();
      ctrl.setCallbacks({ onSelectionEnd: function(bounds, selected) { try { expect(bounds).to.be.an('object'); expect(selected).to.be.an('array'); done(); } catch (err) { done(err); } } });
      ctrl.handleClick(0,0,'left');
      ctrl.handleDrag(10,10);
      ctrl.handleRelease(10,10,'left');
    });
  });

  describe('selectionBox.mock.js (node test mock)', function() {
    const path = require('path');
    const mock = require(path.resolve(__dirname, 'selectionBox.mock.js'));

    it('exports expected functions', function() {
      expect(mock).to.have.property('handleMousePressed');
      expect(mock).to.have.property('handleMouseDragged');
      expect(mock).to.have.property('handleMouseReleased');
      expect(mock).to.have.property('isEntityInBox');
      expect(mock).to.have.property('isEntityUnderMouse');
      expect(mock).to.have.property('deselectAllEntities');
    });

    it('handleMousePressed selects entity when clicking over it', function() {
      const ent = { _sprite: { pos: { x: 10, y: 10 }, size: { x: 10, y: 10 } } };
      let called = false;
      mock.handleMousePressed([ent], 12, 12, function(){ called = true; }, null, null, 16, 0);
      expect(called).to.be.true;
    });

    it('start selection when clicking empty space and exposes global selection state', function() {
      // ensure global cleared
      if (global.isSelecting) { global.isSelecting = false; }
      mock.handleMousePressed([], 0, 0, null, null, null, 16, 0);
      expect(global.isSelecting).to.be.true;
      // simulate drag
      mock.handleMouseDragged(5, 5, []);
      expect(global.selectionEnd).to.exist;
      // release
      mock.handleMouseReleased([], null, null, 16);
      expect(global.isSelecting).to.be.false;
    });

    it('tentative move created on press and cancelled on drag', function() {
      const sel = { moveCommands: [] };
      // start press with selectedEntity to create tentative move
      mock.handleMousePressed([], 10, 10, null, sel, function(x,y,t,e){ if (e) e.moveCommands.push({x,y}); }, 16, 0);
      // ensure tentative exists
      expect(sel.moveCommands.length).to.be.at.least(1);
      // drag should cancel tentative
      mock.handleMouseDragged(20, 20, []);
      expect(sel.moveCommands.length).to.equal(0);
    });
  });
});
