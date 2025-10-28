/**
 * Unit Tests: DynamicGridOverlay Feathering
 * 
 * Tests smooth opacity feathering for grid lines in both scenarios:
 * 1. No tiles painted (mouse-only grid)
 * 2. With painted tiles (feathering around tiles)
 * 
 * Expected behavior:
 * - Grid fades smoothly from center to edges
 * - No abrupt cutoffs
 * - Symmetrical feathering
 * - Opacity decreases with distance from center/tiles
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

describe('DynamicGridOverlay - Feathering Unit Tests', function() {
  let terrain;
  let gridOverlay;
  
  beforeEach(function() {
    // Mock logging
    global.logVerbose = sinon.stub();
    global.logInfo = sinon.stub();
    global.logError = sinon.stub();
    global.logNormal = sinon.stub();
    
    window.logVerbose = global.logVerbose;
    window.logInfo = global.logInfo;
    window.logError = global.logError;
    window.logNormal = global.logNormal;
    
    terrain = new SparseTerrain(32, 'grass', { maxMapSize: 100 });
    gridOverlay = new DynamicGridOverlay(terrain, 2); // bufferSize = 2
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Mouse-Only Grid Feathering (No Tiles Painted)', function() {
    it('should have smooth feathering at mouse position', function() {
      // Mouse at (10, 10)
      gridOverlay.update({ x: 10, y: 10 });
      
      // Get all grid lines
      const gridLines = gridOverlay.gridLines;
      expect(gridLines.length).to.be.greaterThan(0);
      
      // Check that opacities vary (not all the same)
      const opacities = gridLines.map(line => line.opacity);
      const uniqueOpacities = new Set(opacities);
      
      expect(uniqueOpacities.size).to.be.greaterThan(1, 'Should have varying opacity values for feathering');
    });
    
    it('should have highest opacity at mouse center', function() {
      const mouseX = 10;
      const mouseY = 10;
      
      gridOverlay.update({ x: mouseX, y: mouseY });
      
      // Find lines at center (closest to mouse)
      const centerLines = gridOverlay.gridLines.filter(line => {
        const lineGridX = line.x1 / terrain.tileSize;
        const lineGridY = line.y1 / terrain.tileSize;
        
        // Check if line is near mouse position
        const distX = Math.abs(lineGridX - mouseX);
        const distY = Math.abs(lineGridY - mouseY);
        
        return distX <= 0.5 || distY <= 0.5;
      });
      
      // Find lines at edges (far from mouse)
      const edgeLines = gridOverlay.gridLines.filter(line => {
        const lineGridX = line.x1 / terrain.tileSize;
        const lineGridY = line.y1 / terrain.tileSize;
        
        const distX = Math.abs(lineGridX - mouseX);
        const distY = Math.abs(lineGridY - mouseY);
        
        return distX >= 1.5 || distY >= 1.5;
      });
      
      if (centerLines.length > 0 && edgeLines.length > 0) {
        const avgCenterOpacity = centerLines.reduce((sum, line) => sum + line.opacity, 0) / centerLines.length;
        const avgEdgeOpacity = edgeLines.reduce((sum, line) => sum + line.opacity, 0) / edgeLines.length;
        
        expect(avgCenterOpacity).to.be.greaterThan(avgEdgeOpacity, 'Center should have higher opacity than edges');
      }
    });
    
    it('should fade opacity with distance from mouse', function() {
      gridOverlay.update({ x: 10, y: 10 });
      
      const opacities = gridOverlay.gridLines.map(line => line.opacity);
      
      // Should have a range of opacities (gradient effect)
      const maxOpacity = Math.max(...opacities);
      const minOpacity = Math.min(...opacities);
      
      expect(maxOpacity).to.be.greaterThan(minOpacity, 'Should have opacity gradient');
      expect(maxOpacity).to.be.lessThanOrEqual(1.0);
      expect(minOpacity).to.be.greaterThan(0.0, 'Even edge lines should have some visibility');
    });
    
    it('should be nearly invisible at 1.5 tiles from mouse (aggressive feathering)', function() {
      const mouseX = 10;
      const mouseY = 10;
      
      gridOverlay.update({ x: mouseX, y: mouseY });
      
      // Find lines at ~1.5 tiles away
      const farLines = gridOverlay.gridLines.filter(line => {
        const lineGridX = line.x1 / terrain.tileSize;
        const lineGridY = line.y1 / terrain.tileSize;
        
        const distX = Math.abs(lineGridX - mouseX);
        const distY = Math.abs(lineGridY - mouseY);
        const dist = Math.max(distX, distY); // Chebyshev distance
        
        return dist >= 1.5 && dist <= 2.0;
      });
      
      if (farLines.length > 0) {
        const avgFarOpacity = farLines.reduce((sum, line) => sum + line.opacity, 0) / farLines.length;
        
        // Should be very faint (less than 0.25 - practically invisible)
        expect(avgFarOpacity).to.be.lessThan(0.25, 'Lines 1.5+ tiles away should be nearly invisible');
      }
    });
    
    it('should have NO abrupt cutoffs (all lines have opacity > 0)', function() {
      gridOverlay.update({ x: 10, y: 10 });
      
      const zeroOpacityLines = gridOverlay.gridLines.filter(line => line.opacity <= 0);
      
      expect(zeroOpacityLines.length).to.equal(0, 'No lines should have zero opacity (abrupt cutoff)');
    });
    
    it('should be symmetrical around mouse position', function() {
      const mouseX = 10;
      const mouseY = 10;
      
      gridOverlay.update({ x: mouseX, y: mouseY });
      
      // Get vertical lines to left and right of mouse
      const leftLines = gridOverlay.gridLines.filter(line => {
        const lineGridX = line.x1 / terrain.tileSize;
        return lineGridX === mouseX - 1; // 1 tile to left
      });
      
      const rightLines = gridOverlay.gridLines.filter(line => {
        const lineGridX = line.x1 / terrain.tileSize;
        return lineGridX === mouseX + 1; // 1 tile to right
      });
      
      // Should have similar opacities (symmetric)
      if (leftLines.length > 0 && rightLines.length > 0) {
        const leftOpacity = leftLines[0].opacity;
        const rightOpacity = rightLines[0].opacity;
        
        const difference = Math.abs(leftOpacity - rightOpacity);
        expect(difference).to.be.lessThan(0.1, 'Left/right should have similar opacity (symmetric)');
      }
    });
  });
  
  describe('Painted Tiles Grid Feathering', function() {
    beforeEach(function() {
      // Paint a tile at (10, 10)
      terrain.setTile(10, 10, 'grass');
    });
    
    it('should have full opacity at painted tile', function() {
      gridOverlay.update(null);
      
      // Find lines at painted tile (10, 10)
      const tileLines = gridOverlay.gridLines.filter(line => {
        const lineGridX = line.x1 / terrain.tileSize;
        const lineGridY = line.y1 / terrain.tileSize;
        
        return (lineGridX === 10 || lineGridX === 11) && 
               (lineGridY >= 10 && lineGridY <= 11);
      });
      
      if (tileLines.length > 0) {
        const maxOpacity = Math.max(...tileLines.map(l => l.opacity));
        expect(maxOpacity).to.be.greaterThan(0.8, 'Painted tile area should have high opacity');
      }
    });
    
    it('should be nearly invisible at 1.5 tiles from painted tile (aggressive feathering)', function() {
      gridOverlay.update(null);
      
      const tileX = 10;
      const tileY = 10;
      
      // Find lines at ~1.5 tiles away from painted tile
      const farLines = gridOverlay.gridLines.filter(line => {
        const lineGridX = line.x1 / terrain.tileSize;
        const lineGridY = line.y1 / terrain.tileSize;
        
        const distX = Math.abs(lineGridX - tileX);
        const distY = Math.abs(lineGridY - tileY);
        const dist = Math.sqrt(distX * distX + distY * distY); // Euclidean distance
        
        return dist >= 1.5 && dist <= 2.5;
      });
      
      if (farLines.length > 0) {
        const avgFarOpacity = farLines.reduce((sum, line) => sum + line.opacity, 0) / farLines.length;
        
        // Should be very faint or invisible (fast path may use simplified calculation)
        expect(avgFarOpacity).to.be.lessThan(0.45, 'Lines 1.5+ tiles away should be nearly invisible');
      }
    });
    
    it('should fade opacity away from painted tiles', function() {
      gridOverlay.update(null);
      
      const opacities = gridOverlay.gridLines.map(line => line.opacity);
      
      // Should have gradient from painted tile to buffer edges
      const maxOpacity = Math.max(...opacities);
      const minOpacity = Math.min(...opacities);
      
      expect(maxOpacity - minOpacity).to.be.greaterThan(0.2, 'Should have noticeable opacity gradient');
    });
    
    it('should be symmetrical around painted tile', function() {
      gridOverlay.update(null);
      
      // Check lines at equal distance from painted tile
      const tileX = 10;
      const tileY = 10;
      
      // Lines 1 tile away in different directions
      const topLines = gridOverlay.gridLines.filter(line => {
        const lineGridY = line.y1 / terrain.tileSize;
        return lineGridY === tileY - 1;
      });
      
      const bottomLines = gridOverlay.gridLines.filter(line => {
        const lineGridY = line.y1 / terrain.tileSize;
        return lineGridY === tileY + 2; // +2 because grid lines are at edges
      });
      
      if (topLines.length > 0 && bottomLines.length > 0) {
        const avgTopOpacity = topLines.reduce((sum, l) => sum + l.opacity, 0) / topLines.length;
        const avgBottomOpacity = bottomLines.reduce((sum, l) => sum + l.opacity, 0) / bottomLines.length;
        
        const difference = Math.abs(avgTopOpacity - avgBottomOpacity);
        expect(difference).to.be.lessThan(0.2, 'Top/bottom should have similar opacity (symmetric)');
      }
    });
    
    it('should NOT have abrupt disappearances in any direction', function() {
      gridOverlay.update(null);
      
      const region = gridOverlay.calculateGridRegion(null);
      
      // Check all four directions from painted tile
      const directions = [
        { name: 'top', x: 10, y: region.minY },
        { name: 'bottom', x: 10, y: region.maxY },
        { name: 'left', x: region.minX, y: 10 },
        { name: 'right', x: region.maxX, y: 10 }
      ];
      
      directions.forEach(dir => {
        const linesInDirection = gridOverlay.gridLines.filter(line => {
          const lineGridX = line.x1 / terrain.tileSize;
          const lineGridY = line.y1 / terrain.tileSize;
          
          if (dir.name === 'top' || dir.name === 'bottom') {
            return lineGridY === dir.y;
          } else {
            return lineGridX === dir.x;
          }
        });
        
        if (linesInDirection.length > 0) {
          const hasOpacity = linesInDirection.some(line => line.opacity > 0);
          expect(hasOpacity, `${dir.name} direction should have visible grid lines`).to.be.true;
        }
      });
    });
    
    it('should have smooth transition at buffer edges', function() {
      gridOverlay.update(null);
      
      // Get lines at different distances from painted tile
      const distances = [0, 1, 2]; // At tile, 1 away, 2 away (buffer edge)
      const opacitiesByDistance = {};
      
      distances.forEach(dist => {
        const linesAtDistance = gridOverlay.gridLines.filter(line => {
          const lineGridX = line.x1 / terrain.tileSize;
          const lineGridY = line.y1 / terrain.tileSize;
          
          const dx = Math.abs(lineGridX - 10);
          const dy = Math.abs(lineGridY - 10);
          const distance = Math.max(dx, dy); // Chebyshev distance
          
          return distance === dist;
        });
        
        if (linesAtDistance.length > 0) {
          opacitiesByDistance[dist] = linesAtDistance.reduce((sum, l) => sum + l.opacity, 0) / linesAtDistance.length;
        }
      });
      
      // Opacity should decrease with distance
      if (opacitiesByDistance[0] && opacitiesByDistance[1] && opacitiesByDistance[2]) {
        expect(opacitiesByDistance[0]).to.be.greaterThan(opacitiesByDistance[1]);
        expect(opacitiesByDistance[1]).to.be.greaterThan(opacitiesByDistance[2]);
      }
    });
  });
  
  describe('Mixed Mode - Mouse + Painted Tiles', function() {
    beforeEach(function() {
      terrain.setTile(5, 5, 'grass');
    });
    
    it('should have feathering around both mouse and painted tile', function() {
      // Mouse far from painted tile
      gridOverlay.update({ x: 15, y: 15 });
      
      const region = gridOverlay.calculateGridRegion({ x: 15, y: 15 });
      
      // Should cover both areas
      expect(region.minX).to.be.lessThanOrEqual(5);
      expect(region.maxX).to.be.greaterThanOrEqual(15);
      
      // Should have varying opacities across entire region
      const opacities = gridOverlay.gridLines.map(line => line.opacity);
      const uniqueOpacities = new Set(opacities);
      
      expect(uniqueOpacities.size).to.be.greaterThan(1, 'Should have multiple opacity levels');
    });
  });
});
