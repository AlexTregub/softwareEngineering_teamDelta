const { expect } = require('chai');
const CollisionBox2D = require('../../Classes/systems/CollisionBox2D.js');

describe('CollisionBox2D', function() {
  it('constructor sets properties', () => {
    const b = new CollisionBox2D(10, 20, 100, 80);
    expect(b.x).to.equal(10);
    expect(b.y).to.equal(20);
    expect(b.width).to.equal(100);
    expect(b.height).to.equal(80);
  });

  it('contains and isPointInside detect points correctly', () => {
    const b = new CollisionBox2D(10, 10, 100, 100);
    expect(b.contains(50, 50)).to.be.true;
    expect(b.isPointInside(10, 10)).to.be.true;
    expect(b.contains(110, 110)).to.be.true;
    expect(b.contains(5, 50)).to.be.false;
    expect(b.contains(50, 5)).to.be.false;
  });
});
