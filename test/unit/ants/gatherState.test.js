const { expect } = require('chai');

// Ensure Globals used by GatherState are present
global.logVerbose = global.logVerbose || function() {};
global.deltaTime = global.deltaTime || 16; // ms per frame approx

const GatherState = require('../../Classes/ants/GatherState');

describe('GatherState', function() {
  let antMock;
  let resourceManagerMock;
  let movementControllerMock;
  let stateMachineMock;

  beforeEach(function() {
    // reset global resource manager
    global.g_resourceManager = {
      _list: [],
      getResourceList() { return this._list; },
      removeResource(r) { const i = this._list.indexOf(r); if (i !== -1) this._list.splice(i,1); }
    };

    resourceManagerMock = {
      _load: 0,
      isAtMaxLoad() { return this._load >= 5; },
      addResource(r) { if (!r) return false; this._load++; return true; },
      startDropOff(x,y) { this.dropOffCalled = {x,y}; }
    };

    movementControllerMock = {
      lastTarget: null,
      moveToLocation(x,y) { this.lastTarget = {x,y}; }
    };

    stateMachineMock = {
      primary: 'IDLE',
      setPrimaryState(s) { this.primary = s; }
    };

    antMock = {
      id: 'ant-1',
      _antIndex: 1,
      _resourceManager: resourceManagerMock,
      _movementController: movementControllerMock,
      _stateMachine: stateMachineMock,
      posX: 100,
      posY: 100,
      getPosition() { return { x: this.posX, y: this.posY }; }
    };
  });

  afterEach(function() {
    delete global.g_resource_manager;
    delete global.g_resourceManager;
  });

  it('initializes with correct defaults', function() {
    const gs = new GatherState(antMock);
    expect(gs.ant).to.equal(antMock);
    expect(gs.gatherRadius).to.equal(7);
    expect(gs.pixelRadius).to.equal(224);
    expect(gs.isActive).to.be.false;
  });

  it('enter() activates state and sets ant primary state', function() {
    const gs = new GatherState(antMock);
    gs.enter();
    expect(gs.isActive).to.be.true;
    expect(stateMachineMock.primary).to.equal('GATHERING');
  });

  it('exit() deactivates state', function() {
    const gs = new GatherState(antMock);
    gs.enter();
    const res = gs.exit();
    expect(res).to.be.true;
    expect(gs.isActive).to.be.false;
  });

  it('getAntPosition() returns ant position', function() {
    const gs = new GatherState(antMock);
    const pos = gs.getAntPosition();
    expect(pos).to.deep.equal({ x: 100, y: 100 });
  });

  it('getDistance() computes Euclidean distance', function() {
    const gs = new GatherState(antMock);
    const d = gs.getDistance(0,0,3,4);
    expect(d).to.equal(5);
  });

  it('getResourcesInRadius() finds resources from g_resourceManager', function() {
    // add resources near and far
    const near = { x: 110, y: 110, type: 'food' };
    const far = { x: 1000, y: 1000, type: 'stone' };
    global.g_resource_manager = global.g_resource_manager || { _list: [] };
    global.g_resource_manager._list.push(near, far);

    const gs = new GatherState(antMock);
    const found = gs.getResourcesInRadius(100,100,50);
    expect(found).to.be.an('array');
    // should find near only
    expect(found.some(r => r.type === 'food')).to.be.true;
    expect(found.some(r => r.type === 'stone')).to.be.false;
  });

  it('searchForResources() sets nearest resource as targetResource', function() {
    const near = { x: 110, y: 110, type: 'food' };
    const other = { x: 105, y: 105, type: 'leaf' };
    global.g_resourceManager._list.push(near, other);

    const gs = new GatherState(antMock);
    const results = gs.searchForResources();
    expect(results.length).to.equal(2);
    expect(gs.targetResource).to.exist;
    // targetResource should be the closest (other at 7.07 vs near at 14.14)
    expect(gs.targetResource.type).to.equal('leaf');
  });

  it('moveToResource delegates to movement controller', function() {
    const gs = new GatherState(antMock);
    gs.moveToResource(200,200);
    expect(movementControllerMock.lastTarget).to.deep.equal({ x:200, y:200 });
  });

  it('attemptResourceCollection adds resource and removes from system', function() {
    const resource = { x: 110, y: 110, type: 'food' };
    global.g_resourceManager._list.push(resource);

    const gs = new GatherState(antMock);
    // manually set targetResource shape as returned by getResourcesInRadius
    gs.targetResource = { resource: resource, x: resource.x, y: resource.y, type: resource.type };

    gs.attemptResourceCollection();

    // resourceManagerMock should have added the resource (load becomes 1)
    expect(resourceManagerMock._load).to.equal(1);
    // g_resourceManager should no longer contain the resource
    expect(global.g_resourceManager._list.indexOf(resource)).to.equal(-1);
    // targetResource cleared
    expect(gs.targetResource).to.be.null;
  });

  it('isAtMaxCapacity() respects ant resource manager', function() {
    const gs = new GatherState(antMock);
    // initially not max
    resourceManagerMock._load = 0;
    expect(gs.isAtMaxCapacity()).to.be.false;
    resourceManagerMock._load = 5;
    expect(gs.isAtMaxCapacity()).to.be.true;
  });

  it('transitionToDropOff() sets state and calls startDropOff', function() {
    const gs = new GatherState(antMock);
    gs.transitionToDropOff();
    expect(stateMachineMock.primary).to.equal('DROPPING_OFF');
    expect(resourceManagerMock.dropOffCalled).to.exist;
    expect(gs.isActive).to.be.false;
  });

  it('updateTargetMovement collects when in range', function() {
    const resource = { x: 102, y: 102, type: 'food' };
    global.g_resourceManager._list.push(resource);

    const gs = new GatherState(antMock);
    gs.targetResource = { resource, x: resource.x, y: resource.y, type: resource.type };

    // call updateTargetMovement should attempt collection (within 15px)
    gs.updateTargetMovement();
    expect(resourceManagerMock._load).to.equal(1);
    expect(gs.targetResource).to.be.null;
  });

  it('getDebugInfo returns useful info object', function() {
    const gs = new GatherState(antMock);
    const info = gs.getDebugInfo();
    expect(info).to.be.an('object');
    expect(info.hasTarget).to.be.a('boolean');
    expect(info.gatherRadius).to.be.a('string');
  });

  it('setDebugEnabled toggles debug flag', function() {
    const gs = new GatherState(antMock);
    gs.setDebugEnabled(true);
    expect(gs.debugEnabled).to.be.true;
    gs.setDebugEnabled(false);
    expect(gs.debugEnabled).to.be.false;
  });
});
