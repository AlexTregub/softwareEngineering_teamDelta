// TEST FILE: Demonstrates CORRECT usage with test helpers
// This file follows best practices and will pass linting

const { expect } = require('chai');
const sinon = require('sinon');
const { setupTestEnvironment, cleanupTestEnvironment } = require('../../helpers/mvcTestHelpers');

// ✅ CORRECT: Use setupTestEnvironment at top level
setupTestEnvironment({ rendering: true });

describe('Good Test Example - Using Helpers', function() {
  let MyClass;
  
  before(function() {
    // ✅ CORRECT: Load class after environment setup
    MyClass = require('../../../Classes/some/MyClass');
  });
  
  afterEach(function() {
    // ✅ CORRECT: Use cleanupTestEnvironment to restore stubs
    cleanupTestEnvironment();
  });
  
  it('should demonstrate good practices', function() {
    // ✅ CORRECT: Use createVector() provided by setupTestEnvironment
    const vec = createVector(10, 10);
    expect(vec).to.exist;
    expect(vec.x).to.equal(10);
    expect(vec.y).to.equal(10);
  });
  
  it('should have JSDOM available', function() {
    // ✅ CORRECT: window and document provided by setupTestEnvironment
    expect(window).to.exist;
    expect(document).to.exist;
    expect(document.createElement).to.be.a('function');
  });
  
  it('should have CollisionBox2D available', function() {
    // ✅ CORRECT: CollisionBox2D provided by setupTestEnvironment (real implementation)
    expect(global.CollisionBox2D).to.exist;
  });
});
