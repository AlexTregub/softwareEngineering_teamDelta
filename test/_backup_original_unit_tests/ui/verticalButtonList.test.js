/**
 * Basic tests for VerticalButtonList layout and debug metadata.
 */

const { expect } = require('chai');
const { setupVerticalEnvironment } = require('./testHelpers');

// Set up stubs before loading the module
const env = setupVerticalEnvironment({ imgWidth: 64, imgHeight: 32 });
const VerticalButtonList = require('../../Classes/systems/ui/verticalButtonList.js');

describe('VerticalButtonList', function() {
  after(function() {
    env.teardown();
  });

  it('groups configs by y and returns debug arrays', function() {
    const configs = [
      { x:0, y:-50, w:100, h:40, text: 'A' },
      { x:110, y:-50, w:100, h:40, text: 'B' },
      { x:0, y:10, w:200, h:50, text: 'C' }
    ];

    const vb = new VerticalButtonList(400, 300, { spacing: 8, maxWidth: 300, headerImg: null });
    const layout = vb.buildFromConfigs(configs);

    expect(layout.buttons).to.be.an('array');
    expect(layout.debugRects).to.have.lengthOf(3);
    expect(layout.groupRects).to.have.lengthOf(2); // Two rows
    expect(layout.centers).to.have.lengthOf(3);
    expect(layout.header).to.be.null;
  });
});

