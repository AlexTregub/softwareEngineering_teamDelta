// Simple smoke test for ResourceManager pickup behavior
const ResourceManager = require('../Classes/managers/ResourceManager.js');

// Mock resource with pickUp/drop tracking
function makeMockResource(x, y) {
  return {
    x, y,
    pickedBy: null,
    wasDropped: false,
    pickUp(ant) { this.pickedBy = ant; },
    drop(xp, yp) { this.wasDropped = true; if (typeof xp !== 'undefined' && typeof yp !== 'undefined') { this.x = xp; this.y = yp; } }
  };
}

// Mock g_resourceList
global.g_resourceList = {
  _list: [],
  getResourceList() { return this._list; }
};

// Mock ant entity
const mockAnt = {
  posX: 100,
  posY: 100,
  moveToLocation(x, y) { this.posX = x; this.posY = y; }
};

function runTest() {
  const rm = new ResourceManager(mockAnt, 2, 25);

  // add one resource within range and one out of range
  const r1 = makeMockResource(105, 98); // within 25px
  const r2 = makeMockResource(300, 300); // out of range
  global.g_resourceList.getResourceList().push(r1);
  global.g_resourceList.getResourceList().push(r2);

  // run an update (should collect r1)
  rm.update();

  const remaining = global.g_resourceList.getResourceList();
  const carried = rm.getCurrentLoad();

  console.log('Remaining global resources count:', remaining.length);
  console.log('Carried count:', carried);
  console.log('r1 pickedBy:', r1.pickedBy === mockAnt);

  const pass = remaining.length === 1 && carried === 1 && r1.pickedBy === mockAnt;
  console.log(pass ? 'SMOKE TEST PASS' : 'SMOKE TEST FAIL');
  process.exit(pass ? 0 : 2);
}

runTest();
