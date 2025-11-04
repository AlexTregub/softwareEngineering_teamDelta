// TEST FILE: Demonstrates ESLint violations that will be caught
// This file intentionally violates rules to show enforcement

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom'); // ❌ VIOLATION: Importing JSDOM directly

describe('Bad Test Example - Manual Setup', function() {
  let window, document;
  
  before(function() {
    // ❌ VIOLATION: Manually creating JSDOM
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    
    // ❌ VIOLATION: Manually setting global.window
    global.window = dom.window;
    
    // ❌ VIOLATION: Manually setting global.document
    global.document = dom.window.document;
    
    // Mock CollisionBox2D
    global.CollisionBox2D = sinon.stub(); // ❌ VIOLATION: Manual mock
  });
  
  after(function() {
    // ❌ VIOLATION: Manual sinon.restore()
    sinon.restore();
  });
  
  it('should demonstrate bad practices', function() {
    // Using p5.Vector incorrectly
    const vec = new p5.Vector(10, 10); // ❌ VIOLATION: Use createVector() instead
    expect(vec).to.exist;
  });
});
