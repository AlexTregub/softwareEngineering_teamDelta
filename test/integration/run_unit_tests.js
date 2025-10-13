// Minimal test runner for the ResourceManager unit tests when mocha isn't available
const fs = require('fs');
const path = require('path');

// Load the unit test file as a module and execute its tests by requiring the file which registers describe/it
// The test file uses mocha's describe/it; we'll instead require it and execute its assertions directly by importing the test functions.

// Simple inline runner: re-implement the test logic here (copy the assertions).
const assert = require('assert');
const ResourceManager = require('../Classes/managers/ResourceManager.js');

function makeMockResource(x,y){
  return {
    x,y,
    pickedBy: null,
    dropped: false,
    pickUp(ant){ this.pickedBy = ant; },
    drop(xp,yp){ this.dropped = true; if (typeof xp !== 'undefined') this.x = xp; if (typeof yp !== 'undefined') this.y = yp; }
  };
}

let failed = false;
try{
  // Test 1
  global.g_resourceList = { _list: [], getResourceList(){ return this._list } };
  const mockAnt = { posX: 50, posY: 50, moveToLocation(x,y){ this.posX=x; this.posY=y; } };
  const rm = new ResourceManager(mockAnt, 2, 25);

  const r1 = makeMockResource(55,55);
  const r2 = makeMockResource(200,200);
  global.g_resourceList.getResourceList().push(r1);
  global.g_resourceList.getResourceList().push(r2);

  rm.update();

  assert.strictEqual(rm.getCurrentLoad(), 1, 'expected one resource carried');
  assert.strictEqual(global.g_resourceList.getResourceList().length, 1, 'expected one remaining in global list');
  assert.strictEqual(r1.pickedBy, mockAnt, 'expected r1.pickedBy to be mockAnt');

  console.log('Unit Test 1 PASS');

  // Test 2
  global.g_resourceList = { _list: [], getResourceList(){ return this._list } };
  const mockAnt2 = { posX: 0, posY: 0, moveToLocation(x,y){ this.posX=x; this.posY=y; } };
  const rm2 = new ResourceManager(mockAnt2, 5, 25);
  const r3 = makeMockResource(1,1);
  rm2.addResource(r3);
  assert.strictEqual(rm2.getCurrentLoad(), 1);
  const dropped = rm2.processDropOff(global.g_resourceList.getResourceList());
  assert.strictEqual(dropped.length, 1);
  assert.strictEqual(global.g_resourceList.getResourceList().length, 1);
  assert.strictEqual(r3.dropped, true, 'expected drop() to be invoked on resource');

  console.log('Unit Test 2 PASS');
} catch (e) {
  console.error('Unit Test FAIL:', e && e.message);
  failed = true;
}

process.exit(failed ? 2 : 0);
