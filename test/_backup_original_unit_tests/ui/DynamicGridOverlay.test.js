/**
 * DynamicGridOverlay v3 - Unit Tests
 * 
 * Tests the simplified grid overlay (direct rendering, no caching)
 * 
 * v3 Changes:
 * - Removed UIObject inheritance
 * - Removed CacheManager integration
 * - Removed feathering system
 * - Removed edge detection
 * - Direct p5.js rendering each frame
 * - Only renders grid for painted tiles (sparse)
 * 
 * Total: 13 tests
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('DynamicGridOverlay', function() {
    let mockTerrain, overlay;
    let pushStub, popStub, strokeStub, strokeWeightStub, lineStub;
    
    beforeEach(function() {
        // Mock p5.js drawing functions
        pushStub = sinon.stub();
        popStub = sinon.stub();
        strokeStub = sinon.stub();
        strokeWeightStub = sinon.stub();
        lineStub = sinon.stub();
        
        global.push = pushStub;
        global.pop = popStub;
        global.stroke = strokeStub;
        global.strokeWeight = strokeWeightStub;
        global.line = lineStub;
        
        // Mock SparseTerrain with CORRECT generator function API
        mockTerrain = {
            getAllTiles: function* () {
                yield { x: 0, y: 0, material: 'grass' };
                yield { x: 1, y: 0, material: 'grass' };
                yield { x: 0, y: 1, material: 'grass' };
                yield { x: 1, y: 1, material: 'grass' };
            }
        };
        
        const DynamicGridOverlay = require('../../../Classes/ui/DynamicGridOverlay');
        overlay = new DynamicGridOverlay(mockTerrain, 32, 2);
    });
    
    afterEach(function() {
        sinon.restore();
        delete global.push;
        delete global.pop;
        delete global.stroke;
        delete global.strokeWeight;
        delete global.line;
    });
    
    describe('Constructor', function() {
        it('should initialize with defaults', function() {
            expect(overlay.terrain).to.equal(mockTerrain);
            expect(overlay.tileSize).to.equal(32);
            expect(overlay.bufferSize).to.equal(2);
            expect(overlay.visible).to.equal(true);
        });
        
        it('should use default tileSize=32 when not provided', function() {
            const DynamicGridOverlay = require('../../../Classes/ui/DynamicGridOverlay');
            const defaultOverlay = new DynamicGridOverlay(mockTerrain);
            expect(defaultOverlay.tileSize).to.equal(32);
            expect(defaultOverlay.bufferSize).to.equal(2);
        });
    });
    
    describe('render()', function() {
        it('should skip rendering when not visible', function() {
            overlay.visible = false;
            overlay.render();
            
            expect(pushStub.called).to.be.false;
            expect(lineStub.called).to.be.false;
        });
        
        it('should skip rendering when terrain is null', function() {
            overlay.terrain = null;
            overlay.render();
            
            expect(pushStub.called).to.be.false;
            expect(lineStub.called).to.be.false;
        });
        
        it('should skip rendering when getAllTiles not available', function() {
            overlay.terrain = {};
            overlay.render();
            
            expect(pushStub.called).to.be.false;
            expect(lineStub.called).to.be.false;
        });
        
        it('should skip rendering when no tiles exist', function() {
            // Override with empty generator
            overlay.terrain = {
                getAllTiles: function* () {
                    // Empty - yields nothing
                }
            };
            overlay.render();
            
            expect(pushStub.called).to.be.false;
            expect(lineStub.called).to.be.false;
        });
        
        it('should render grid for painted tiles with buffer', function() {
            overlay.render();
            
            // Should call drawing setup
            expect(pushStub.calledOnce).to.be.true;
            expect(popStub.calledOnce).to.be.true;
            expect(strokeStub.calledOnce).to.be.true;
            expect(strokeWeightStub.calledOnce).to.be.true;
            
            // Should draw grid lines
            expect(lineStub.called).to.be.true;
        });
        
        it('should calculate bounds from painted tiles', function() {
            // Tiles at (0,0), (1,0), (0,1), (1,1)
            // Bounds: minX=0, maxX=1, minY=0, maxY=1
            // With bufferSize=2: minX=-2, maxX=3, minY=-2, maxY=3
            
            overlay.render();
            
            // Vertical lines: from -2 to 4 (7 lines)
            // Horizontal lines: from -2 to 4 (7 lines)
            const totalLines = 7 + 7;
            expect(lineStub.callCount).to.equal(totalLines);
        });
        
        it('should use grid appearance settings', function() {
            overlay.gridColor = [100, 150, 200, 80];
            overlay.gridWeight = 2;
            
            overlay.render();
            
            expect(strokeStub.calledWith(100, 150, 200, 80)).to.be.true;
            expect(strokeWeightStub.calledWith(2)).to.be.true;
        });
    });
    
    describe('setVisible()', function() {
        it('should toggle visibility', function() {
            overlay.setVisible(false);
            expect(overlay.visible).to.be.false;
            
            overlay.setVisible(true);
            expect(overlay.visible).to.be.true;
        });
    });
    
    describe('destroy()', function() {
        it('should complete without errors', function() {
            expect(() => overlay.destroy()).to.not.throw();
        });
    });
    
    describe('CRITICAL: Real SparseTerrain Integration', function() {
        it('should handle generator function from getAllTiles()', function() {
            // SparseTerrain.getAllTiles() is a GENERATOR that yields {x, y, material} objects
            const realTerrainMock = {
                getAllTiles: function* () {
                    yield { x: 0, y: 0, material: 'grass' };
                    yield { x: 1, y: 0, material: 'grass' };
                    yield { x: 0, y: 1, material: 'grass' };
                    yield { x: 1, y: 1, material: 'grass' };
                }
            };
            
            const DynamicGridOverlay = require('../../../Classes/ui/DynamicGridOverlay');
            const realOverlay = new DynamicGridOverlay(realTerrainMock, 32, 2);
            
            // This should NOT throw "not iterable" error
            expect(() => realOverlay.render()).to.not.throw();
            
            // Should have called drawing functions
            expect(pushStub.called).to.be.true;
            expect(lineStub.called).to.be.true;
        });
        
        it('should calculate bounds from generator objects with x,y properties', function() {
            const realTerrainMock = {
                getAllTiles: function* () {
                    yield { x: 5, y: 3, material: 'grass' };
                    yield { x: 7, y: 3, material: 'stone' };
                    yield { x: 5, y: 6, material: 'dirt' };
                }
            };
            
            const DynamicGridOverlay = require('../../../Classes/ui/DynamicGridOverlay');
            const realOverlay = new DynamicGridOverlay(realTerrainMock, 32, 2);
            
            realOverlay.render();
            
            // Bounds: minX=5, maxX=7, minY=3, maxY=6
            // With bufferSize=2: minX=3, maxX=9, minY=1, maxY=8
            // Vertical lines: from 3 to 10 (8 lines)
            // Horizontal lines: from 1 to 9 (9 lines)
            const totalLines = 8 + 9;
            expect(lineStub.callCount).to.equal(totalLines);
        });
    });
});
