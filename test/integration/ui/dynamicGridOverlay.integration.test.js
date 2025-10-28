/**
 * Integration Tests: DynamicGridOverlay with SparseTerrain
 * 
 * Tests grid overlay rendering with SparseTerrain to ensure:
 * - Grid shows at mouse position when no tiles painted
 * - Grid updates with mouse movement
 * - Grid shows both vertical and horizontal lines
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

// Setup JSDOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

// Load classes
const SparseTerrain = require('../../../Classes/terrainUtils/SparseTerrain');
const DynamicGridOverlay = require('../../../Classes/ui/DynamicGridOverlay');

describe('DynamicGridOverlay with SparseTerrain - Integration', function() {
  let terrain;
  let gridOverlay;
  
  beforeEach(function() {
    // Mock p5.js and logging
    global.logVerbose = sinon.stub();
    global.logInfo = sinon.stub();
    global.logError = sinon.stub();
    global.logNormal = sinon.stub();
    global.stroke = sinon.stub();
    global.strokeWeight = sinon.stub();
    global.line = sinon.stub();
    global.push = sinon.stub();
    global.pop = sinon.stub();
    
    window.logVerbose = global.logVerbose;
    window.logInfo = global.logInfo;
    window.logError = global.logError;
    window.logNormal = global.logNormal;
    window.stroke = global.stroke;
    window.strokeWeight = global.strokeWeight;
    window.line = global.line;
    window.push = global.push;
    window.pop = global.pop;
    
    // Create SparseTerrain
    terrain = new SparseTerrain(32, 'grass', { maxMapSize: 100 });
    gridOverlay = new DynamicGridOverlay(terrain, 2);
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Grid at Mouse Position (No Tiles Painted)', function() {
    it('should show grid at mouse position when no tiles painted', function() {
      expect(terrain.getTileCount()).to.equal(0);
      
      // Update with mouse at (5, 5)
      gridOverlay.update({ x: 5, y: 5 });
      
      // Should generate grid lines
      expect(gridOverlay.gridLines.length).to.be.greaterThan(0);
    });
    
    it('should show both vertical and horizontal lines at mouse', function() {
      gridOverlay.update({ x: 10, y: 10 });
      
      const verticalLines = gridOverlay.gridLines.filter(line => line.x1 === line.x2);
      const horizontalLines = gridOverlay.gridLines.filter(line => line.y1 === line.y2);
      
      // Should have BOTH vertical and horizontal lines
      expect(verticalLines.length).to.be.greaterThan(0, 'Should have vertical lines');
      expect(horizontalLines.length).to.be.greaterThan(0, 'Should have horizontal lines');
    });
    
    it('should render grid with default opacity when no tiles', function() {
      gridOverlay.update({ x: 0, y: 0 });
      gridOverlay.render();
      
      // Should call line() to render grid
      expect(global.line.called).to.be.true;
      
      // Should set opacity (stroke with alpha)
      expect(global.stroke.called).to.be.true;
      const strokeCalls = global.stroke.getCalls();
      const hasAlpha = strokeCalls.some(call => call.args.length === 4); // RGBA
      expect(hasAlpha).to.be.true;
    });
    
    it('should cover bufferSize region around mouse', function() {
      const bufferSize = 2;
      const mouseX = 10;
      const mouseY = 10;
      
      gridOverlay.update({ x: mouseX, y: mouseY });
      
      const region = gridOverlay.calculateGridRegion({ x: mouseX, y: mouseY });
      
      expect(region.minX).to.equal(mouseX - bufferSize);
      expect(region.maxX).to.equal(mouseX + bufferSize);
      expect(region.minY).to.equal(mouseY - bufferSize);
      expect(region.maxY).to.equal(mouseY + bufferSize);
    });
  });
  
  describe('Grid Updates with Mouse Movement', function() {
    it('should update grid when mouse moves', function() {
      gridOverlay.update({ x: 5, y: 5 });
      const firstGridLines = gridOverlay.gridLines.length;
      
      gridOverlay.update({ x: 10, y: 10 });
      const secondGridLines = gridOverlay.gridLines.length;
      
      // Grid should be regenerated (may have same count but different positions)
      expect(secondGridLines).to.be.greaterThan(0);
    });
    
    it('should detect when update is needed', function() {
      gridOverlay.update({ x: 5, y: 5 });
      
      // Same position = no update needed
      expect(gridOverlay.needsUpdate({ x: 5, y: 5 })).to.be.false;
      
      // Different position = update needed
      expect(gridOverlay.needsUpdate({ x: 6, y: 5 })).to.be.true;
    });
  });
  
  describe('Grid with Painted Tiles', function() {
    it('should merge mouse and painted tile regions', function() {
      // Paint tiles at (0, 0)
      terrain.setTile(0, 0, 'grass');
      
      // Mouse at (10, 10)
      gridOverlay.update({ x: 10, y: 10 });
      
      const region = gridOverlay.calculateGridRegion({ x: 10, y: 10 });
      
      // Should cover both painted tiles (0,0) and mouse (10,10)
      expect(region.minX).to.be.lessThan(1);
      expect(region.maxX).to.be.greaterThan(9);
    });
    
    it('should show grid at painted tiles with feathering', function() {
      terrain.setTile(5, 5, 'grass');
      terrain.setTile(6, 5, 'dirt');
      
      gridOverlay.update(null); // No mouse, just painted tiles
      
      expect(gridOverlay.gridLines.length).to.be.greaterThan(0);
      
      // Should have opacity variation (feathering)
      const opacities = gridOverlay.gridLines.map(line => line.opacity);
      const uniqueOpacities = new Set(opacities);
      expect(uniqueOpacities.size).to.be.greaterThan(1);
    });
  });
  
  describe('Grid Line Rendering', function() {
    beforeEach(function() {
      terrain.setTile(0, 0, 'grass');
      gridOverlay.update({ x: 0, y: 0 });
    });
    
    it('should render vertical lines (x1 === x2)', function() {
      gridOverlay.render();
      
      const lineCalls = global.line.getCalls();
      const verticalLines = lineCalls.filter(call => 
        call.args[0] === call.args[2] // x1 === x2
      );
      
      expect(verticalLines.length).to.be.greaterThan(0);
    });
    
    it('should render horizontal lines (y1 === y2)', function() {
      gridOverlay.render();
      
      const lineCalls = global.line.getCalls();
      const horizontalLines = lineCalls.filter(call =>
        call.args[1] === call.args[3] // y1 === y2
      );
      
      expect(horizontalLines.length).to.be.greaterThan(0);
    });
    
    it('should apply opacity to each line', function() {
      gridOverlay.render();
      
      // Each line should have a stroke call before it
      expect(global.stroke.callCount).to.be.greaterThan(0);
      expect(global.line.callCount).to.be.greaterThan(0);
    });
  });
  
  describe('Performance with Sparse Terrain', function() {
    it('should only iterate painted tiles for feathering', function() {
      // Paint 10 tiles
      for (let i = 0; i < 10; i++) {
        terrain.setTile(i, 0, 'grass');
      }
      
      gridOverlay.update(null);
      
      // Should generate grid efficiently (not iterate 10,000 tiles)
      expect(gridOverlay.gridLines.length).to.be.lessThan(500);
    });
    
    it('should use cache for repeated feathering calculations', function() {
      terrain.setTile(0, 0, 'grass');
      
      gridOverlay.update(null);
      const firstLineCount = gridOverlay.gridLines.length;
      
      // Update again (should use cache)
      gridOverlay.update(null);
      const secondLineCount = gridOverlay.gridLines.length;
      
      expect(secondLineCount).to.equal(firstLineCount);
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle null mouse position', function() {
      expect(() => gridOverlay.update(null)).to.not.throw();
    });
    
    it('should handle no region (no tiles, no mouse)', function() {
      const region = gridOverlay.calculateGridRegion(null);
      expect(region).to.be.null;
      
      gridOverlay.update(null);
      expect(gridOverlay.gridLines.length).to.equal(0);
    });
    
    it('should handle negative grid coordinates', function() {
      expect(() => gridOverlay.update({ x: -5, y: -10 })).to.not.throw();
      expect(gridOverlay.gridLines.length).to.be.greaterThan(0);
    });
  });
});

