const { expect } = require('chai');
const sinon = require('sinon');

describe('NPCManager', function() {
  let NPCModule, NPC, createNPC;
  let mockRenderController;

  beforeEach(function() {
    // Minimal mock Building to satisfy inheritance
    global.Building = class Building {
      constructor(x, y, w, h, img, type, options) {
        this.posX = x;
        this.posY = y;
        this.width = w;
        this.height = h;
        this.image = img;
        this.type = type || 'Building';
        this.faction = (options && options.faction) || 'neutral';
        this.isActive = true;
        this._controllers = new Map();
      }
      getController(name) { return this._controllers.get(name) || null; }
      getAnts(faction) {
        if (!Array.isArray(global.ants)) return [];
        return global.ants.filter(a => a.faction === faction);
      }
      update() { this._updated = true; }
      render() { this._rendered = true; }
    };

    // p5 / environment helpers
    global.loadImage = sinon.stub().returns({ width: 1, height: 1 });
    global.dist = (x1, y1, x2, y2) => {
      const dx = x1 - x2;
      const dy = y1 - y2;
      return Math.sqrt(dx*dx + dy*dy);
    };

    // selection arrays
    global.selectables = [];

    // simple ants array for dialogues
    global.ants = [];

    // prepare a render controller spy
    mockRenderController = { highlightBoxHover: sinon.spy() };

    // require module after mocks
    NPCModule = require('../../../Classes/managers/NPCManager.js');
    NPC = NPCModule.NPC;
    createNPC = NPCModule.createNPC;
  });

  afterEach(function() {
    sinon.restore();
    // cleanup globals
    delete require.cache[require.resolve('../../../Classes/managers/NPCManager.js')];
    delete global.Building;
    delete global.loadImage;
    delete global.dist;
    delete global.selectables;
    delete global.ants;
    delete global.NPCList;
  });

  describe('NPC Class', function() {
    it('constructor should set position, defaults and dialogueRange', function() {
      const npc = new NPC(10, 20);
      expect(npc.posX).to.equal(10);
      expect(npc.posY).to.equal(20);
      expect(npc._x).to.equal(10);
      expect(npc._y).to.equal(20);
      expect(npc._faction).to.equal('player');
      expect(npc.isBoxHovered).to.be.false;
      expect(npc.dialogueRange).to.equal(100);
    });

    it('initDialogues should log when Queen ant within range', function() {
      const npc = new NPC(0, 0);
      // add a Queen within range
      global.ants.push({ posX: 50, posY: 0, faction: 'player', jobName: 'Queen' });
      const logSpy = sinon.stub(console, 'log');
      npc.initDialogues();
      expect(logSpy.called).to.be.true;
      logSpy.restore();
    });

    it('initDialogues should not log for non-Queen ants', function() {
      const npc = new NPC(0, 0);
      global.ants.push({ posX: 10, posY: 0, faction: 'player', jobName: 'Worker' });
      const logSpy = sinon.stub(console, 'log');
      npc.initDialogues();
      expect(logSpy.called).to.be.false;
      logSpy.restore();
    });

    it('update should call initDialogues', function() {
      const npc = new NPC(0, 0);
      const spy = sinon.spy(npc, 'initDialogues');
      npc.update();
      expect(spy.calledOnce).to.be.true;
      spy.restore();
    });

    it('render should not proceed when inactive', function() {
      const npc = new NPC(0, 0);
      npc._controllers.set('render', mockRenderController);
      npc.isActive = false;
      const highlightSpy = mockRenderController.highlightBoxHover;
      npc.isBoxHovered = true;
      npc.render();
      expect(highlightSpy.notCalled).to.be.true;
    });

    it('render should call highlightBoxHover when isBoxHovered is true', function() {
      const npc = new NPC(5, 5);
      npc._controllers.set('render', mockRenderController);
      npc.isActive = true;
      npc.isBoxHovered = true;
      // ensure base render is available
      const baseRenderSpy = sinon.spy(npc, 'render'); // will wrap but not prevent behavior
      // Call NPC.render (note: spying on the same method isn't necessary; just call)
      // To avoid recursion, call the original implementation:
      NPC.prototype.render.call(npc);
      expect(mockRenderController.highlightBoxHover.calledOnce).to.be.true;
      baseRenderSpy.restore();
    });
  });

  describe('createNPC function', function() {
    it('should create an NPC instance, activate it and add to NPCList and selectables', function() {
      // ensure globals are present
      global.NPCList = [];
      const npc = createNPC(12, 34);
      expect(npc).to.exist;
      expect(npc).to.be.instanceOf(NPC);
      expect(npc.isActive).to.be.true;
      expect(global.NPCList).to.include(npc);
      expect(global.selectables).to.include(npc);
    });
  });
});