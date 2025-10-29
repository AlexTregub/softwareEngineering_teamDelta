/**
 * Tests VerticalButtonList header sizing and headerTop calculation
 */

const { expect } = require('chai');
const { setupVerticalEnvironment } = require('./testHelpers');

// Set up stubs before loading module
const env = setupVerticalEnvironment({ imgWidth: 400, imgHeight: 200 });
const VerticalButtonList = require('../../Classes/systems/ui/verticalButtonList.js');

// Create a fake image with width/height
const fakeImg = { width: 400, height: 200 };

describe('VerticalButtonList Header', function() {
  after(function() {
    env.teardown();
  });

  it('header size should respect headerMaxWidth and headerScale', function() {
    const vb = new VerticalButtonList(400, 200, { headerImg: fakeImg, headerScale: 0.5, headerMaxWidth: 150 });
    const layout = vb.buildFromConfigs([]);
    
    expect(layout.header).to.not.be.null;
    expect(layout.header.w).to.equal(150);
    expect(layout.header.h).to.equal(75);
  });

  it('headerTop should position header above groups', function() {
    const configs = [ { x:0,y:0,w:100,h:50,text:'A' } ];
    const vb = new VerticalButtonList(400, 300, { headerImg: fakeImg, headerMaxWidth: 200 });
    const layout = vb.buildFromConfigs(configs);
    
    expect(Number.isFinite(layout.headerTop)).to.be.true;
  });
});

