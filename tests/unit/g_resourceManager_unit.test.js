const assert = require('assert');
const ResourceManager = require('../../src/core/managers/ResourceManager.js');

function makeMockResource(x,y){
  return {
    x,y,
    pickedBy: null,
    dropped: false,
    pickUp(ant){ this.pickedBy = ant; },
    drop(xp,yp){ this.dropped = true; if (typeof xp !== 'undefined') this.x = xp; if (typeof yp !== 'undefined') this.y = yp; }
  };
}

describe('ResourceManager', function(){
  it('should pick up a nearby resource and remove it from global list', function(){
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
  });

  it('should drop resources back into global list on processDropOff and call drop()', function(){
    global.g_resourceList = { _list: [], getResourceList(){ return this._list } };
    const mockAnt = { posX: 0, posY: 0, moveToLocation(x,y){ this.posX=x; this.posY=y; } };
    const rm = new ResourceManager(mockAnt, 5, 25);

    const r1 = makeMockResource(1,1);
    rm.addResource(r1);
    assert.strictEqual(rm.getCurrentLoad(), 1);

    const dropped = rm.processDropOff(global.g_resourceList.getResourceList());
    assert.strictEqual(dropped.length, 1);
    assert.strictEqual(global.g_resourceList.getResourceList().length, 1);
    assert.strictEqual(r1.dropped, true, 'expected drop() to be invoked on resource');
  });
});
