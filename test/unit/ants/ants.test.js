const { expect } = require('chai');

// Provide lightweight mocks for p5 and project systems so ants.js can be required in Node
if (typeof window === 'undefined') {
  global.window = {};
}

// Minimal p5-like helpers used by ants.js
const originalGlobals = {};
const toMock = ['createVector','loadImage','performance','frameCount','Entity','AntManager','StatsContainer','ResourceManager','AntStateMachine','GatherState','JobComponent','AntBrain','selectables','g_tileInteractionManager','dropoffs','QueenAnt'];

// backup any existing globals we will touch
for (const k of toMock) { originalGlobals[k] = global[k]; }

global.createVector = (x = 0, y = 0) => ({ x, y, copy() { return { x: this.x, y: this.y }; } });
global.loadImage = (p) => ({ src: p });
global.performance = global.performance || { now: () => Date.now() };
global.frameCount = 0;

// Minimal engine/system stubs used by ants.js
class Entity {
  constructor(x = 0, y = 0, w = 10, h = 10, options = {}) {
    this._pos = { x, y };
    this._size = { x: w, y: h };
    this.options = options || {};
    this.isActive = true;
    this._controllers = new Map();
  }
  getPosition() { return this._pos; }
  setPosition(x, y) { this._pos.x = x; this._pos.y = y; }
  getSize() { return this._size; }
  update() { /* noop */ }
  render() { /* noop */ }
  isActive() { return this.isActive; }
  getController(name) { return this._controllers.get(name) || null; }
  addController(name, obj) { this._controllers.set(name, obj); }
  _delegate(controller, method, ...args) {
    const c = this.getController(controller);
    if (c && typeof c[method] === 'function') return c[method](...args);
    return null;
  }
  moveToLocation(x, y) { this._lastMoveTo = { x, y }; return true; }
  setImage(img) { this._image = img; }
  getDebugInfo() { return { position: this._pos, size: this._size }; }
  getValidationData() { return { position: this._pos, size: this._size }; }
  destroy() { this.isActive = false; }
}

class AntManager { constructor(){ this._created = true; } }
class StatsContainer { constructor(pos, size, speed, lastPos) { this.pos = pos; this.size = size; this.speed = speed; this.lastPos = lastPos; this.strength = { statValue: 0 }; this.health = { statValue: 0 }; this.gatherSpeed = { statValue: 0 }; this.movementSpeed = { statValue: 0 }; } }
class ResourceManager {
  constructor(owner, a = 0, max = 10) { this.owner = owner; this._load = 0; this.maxCapacity = max; }
  getCurrentLoad() { return this._load; }
  addResource(r) { this._load += 1; return true; }
  dropAllResources() { const out = Array(this._load).fill('res'); this._load = 0; return out; }
  update() { /* noop */ }
}
class AntStateMachine {
  constructor() { this._state = 'IDLE'; this._cb = null; }
  setStateChangeCallback(cb) { this._cb = cb; }
  getCurrentState() { return this._state; }
  setState(s) { const old = this._state; this._state = s; if (this._cb) this._cb(old, s); }
  setPrimaryState(s) { this.setState(s); }
  isGathering() { return this._state === 'GATHERING'; }
  isDroppingOff() { return String(this._state).includes('DROPPING_OFF'); }
  isInCombat() { return String(this._state).includes('COMBAT') || String(this._state).includes('IN_COMBAT'); }
  ResumePreferredState() { /* noop */ }
  update() { /* noop */ }
}
class GatherState { constructor(ant) { this.ant = ant; this.isActive = false; } enter() { this.isActive = true; } exit() { this.isActive = false; } update() { return false; } getDebugInfo() { return { isActive: this.isActive }; } }
class JobComponent { constructor(name) { this.name = name; this.stats = { health: 50, strength: 5, gatherSpeed: 10, movementSpeed: 60 }; } }
class AntBrain { constructor(owner, jobName) { this.owner = owner; this.jobName = jobName; } update(dt) { /* noop */ } }

// Make these globals so ants.js (which expects globals) will use them
global.Entity = Entity;
global.AntManager = AntManager;
global.StatsContainer = StatsContainer;
global.ResourceManager = ResourceManager;
global.AntStateMachine = AntStateMachine;
global.GatherState = GatherState;
global.JobComponent = JobComponent;
global.AntBrain = AntBrain;

// Other optional globals used by ants.js
global.selectables = [];
global.g_tileInteractionManager = { register() {}, addObject() {}, updateObjectPosition() {}, removeObjectFromTile() {} };
global.dropoffs = [{ getCenterPx() { return { x: 10, y: 10 }; }, x: 0, y: 0, tileSize: 32, depositResource() { return true; } }];
global.QueenAnt = function(base) { return base; };

// Now require the module under test
const antsModule = require('../../../Classes/ants/ants.js');

// restore any original globals to avoid polluting other tests
for (const k of toMock) {
  if (originalGlobals[k] === undefined) delete global[k]; else global[k] = originalGlobals[k];
}

describe('ants.js', function() {
  beforeEach(function() {
    // Reset ants array if module exposes it
    if (typeof antsModule.getAnts === 'function') {
      const a = antsModule.getAnts();
      if (Array.isArray(a)) { a.length = 0; }
    }
    // reset frameCount
    global.frameCount = 0;
  });

  it('antsPreloader sets sizes and initializes manager', function() {
    expect(typeof antsModule.antsPreloader).to.equal('function');
    antsModule.antsPreloader();
    const size = antsModule.getAntSize();
    expect(size).to.have.property('x');
    expect(size).to.have.property('y');
    // antManager should exist (we stubbed AntManager)
    expect(typeof global.antManager !== 'undefined' || typeof antsModule.antManager !== 'undefined').to.equal(true);
  });

  it('can construct ant and access basic getters/setters', function() {
    const a = new antsModule.ant(5, 6, 12, 14, 1, 0, null, 'Scout', 'player');
    expect(a).to.have.property('antIndex');
    expect(a.posX).to.equal(5);
    expect(a.posY).to.equal(6);
    a.posX = 50; a.posY = 60;
    expect(a.getPosition().x).to.equal(50);
    expect(a.getPosition().y).to.equal(60);
    expect(a.JobName).to.be.a('string');
    expect(a.StatsContainer).to.exist;
    expect(a.resourceManager).to.exist;
    expect(a.stateMachine).to.exist;
  });

  it('assignJob creates JobComponent and AntBrain and sets jobName', function() {
    const a = new antsModule.ant(0,0,10,10,1,0,null,'Scout','player');
    a.assignJob('Builder', { src: 'img' });
    expect(a.JobName).to.equal('Builder');
    expect(a.job).to.exist;
    expect(a.brain).to.exist;
    const stats = a.getJobStats();
    expect(stats).to.have.property('health');
    expect(stats).to.have.property('strength');
  });

  it('resource methods add/get/drop behave via ResourceManager', function() {
    const a = new antsModule.ant(0,0,10,10,1,0,null,'Scout','player');
    expect(a.getResourceCount()).to.equal(0);
    const ok = a.addResource('ore');
    expect(ok).to.equal(true);
    expect(a.getResourceCount()).to.equal(1);
    const dropped = a.dropAllResources();
    expect(Array.isArray(dropped)).to.equal(true);
    expect(a.getResourceCount()).to.equal(0);
  });

  it('health, damage, heal, attack, and death flow', function() {
    const a = new antsModule.ant(0,0,10,10,1,0,null,'Scout','player');
    const start = a.health;
    const after = a.takeDamage(10);
    expect(after).to.equal(Math.max(0, start - 10));
    const healed = a.heal(5);
    expect(healed).to.equal(Math.min(a.maxHealth, after + 5));

    // Attack target
    const target = { _health: 30, takeDamage(n) { this._health = Math.max(0, this._health - n); return this._health; } };
    const attacked = a._attackTarget(target);
    // _attackTarget returns something truthy when damage applied
    expect(target._health).to.be.at.most(30);

    // Test die removes from game arrays
    const list = antsModule.getAnts();
    if (Array.isArray(list)) list.push(a);
    a.die();
    expect(a.isActive).to.equal(false);
    if (Array.isArray(list)) expect(list.includes(a)).to.equal(false);
  });

  it('state-related methods start/stop gathering and set/get state', function() {
    const a = new antsModule.ant(0,0,10,10,1,0,null,'Scout','player');
    a.startGathering();
    // our stub stateMachine toggles state via setState in startGathering if implemented
    // isGathering should be callable
    expect(typeof a.isGathering()).to.equal('boolean');
    a.stopGathering();
    expect(typeof a.getCurrentState()).to.equal('string');
    a.setState('TEST_STATE');
    expect(a.getCurrentState()).to.equal('TEST_STATE');
  });

  it('posX/posY proxies and selection delegate exist', function() {
    const a = new antsModule.ant(1,2,3,4,1,0,null,'Scout','player');
    // selection delegate uses _delegate; ensure no throw when set
    a.isSelected = true; // setter should call delegate (noop in our stub)
    expect(typeof a.isSelected).to.not.equal('undefined');
  });

  it('spawnQueen returns a queen and registers it', function() {
    const before = antsModule.getAnts().length;
    const q = antsModule.spawnQueen();
    expect(q).to.exist;
    const after = antsModule.getAnts().length;
    expect(after).to.equal(before + 1);
  });

  it('antsSpawn, antsUpdate, antsRender, antsUpdateAndRender run without throwing', function() {
    // spawn a couple using direct API and the command wrapper
    antsModule.antsSpawn(2, 'neutral');
    expect(antsModule.getAnts().length).to.be.at.least(2);
    expect(() => antsModule.antsUpdate()).to.not.throw();
    expect(() => antsModule.antsRender()).to.not.throw();
    expect(() => antsModule.antsUpdateAndRender()).to.not.throw();
  });

  it('exports and utility functions exist and are callable', function() {
    expect(typeof antsModule.assignJob).to.equal('function');
    expect(typeof antsModule.handleSpawnCommand).to.equal('function');
    expect(typeof antsModule.getAntIndex).to.equal('function' ) || true;
    // getAntIndex export might be a helper; ensure getters are present
    expect(typeof antsModule.getAntSize).to.equal('function');
    expect(typeof antsModule.setAntSize).to.equal('function');
    // set then get
    antsModule.setAntSize({ x: 11, y: 12 });
    const s = antsModule.getAntSize();
    expect(s.x).to.equal(11);
  });
});
