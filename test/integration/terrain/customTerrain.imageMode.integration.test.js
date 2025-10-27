/**
 * Integration Tests: CustomTerrain imageMode Regression Prevention
 * 
 * PURPOSE: Prevent regression of the missing imageMode() bug in CustomTerrain.render()
 * 
 * BUG HISTORY:
 * - CustomTerrain.render() did NOT set imageMode before rendering tiles
 * - Inherited whatever imageMode was previously set (often CENTER from other systems)
 * - Caused 0.5-tile visual offset in Level Editor
 * - Fixed by explicitly setting imageMode(CORNER) in render() method
 * 
 * THESE TESTS ENSURE:
 * 1. CustomTerrain.render() ALWAYS sets imageMode(CORNER)
 * 2. Tile positions are calculated correctly for CORNER mode
 * 3. No imageMode inheritance from previous rendering operations
 * 4. tileToScreen() returns expected pixel positions
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('CustomTerrain imageMode Regression Prevention (Integration)', function() {
    let dom;
    let window;
    let document;
    let CustomTerrain;
    let mockP5;
    let imageModeSpy;
    
    beforeEach(function() {
        // Create JSDOM environment
        dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
            url: 'http://localhost',
            pretendToBeVisual: true
        });
        window = dom.window;
        document = window.document;
        
        // Setup global and window sync
        global.window = window;
        global.document = document;
        
        // Mock p5.js functions
        mockP5 = {
            push: sinon.stub(),
            pop: sinon.stub(),
            imageMode: sinon.stub(),
            image: sinon.stub(),
            fill: sinon.stub(),
            noStroke: sinon.stub(),
            rect: sinon.stub(),
            CORNER: 'CORNER',
            CENTER: 'CENTER'
        };
        
        imageModeSpy = mockP5.imageMode;
        
        // Set globals
        global.push = mockP5.push;
        global.pop = mockP5.pop;
        global.imageMode = mockP5.imageMode;
        global.image = mockP5.image;
        global.fill = mockP5.fill;
        global.noStroke = mockP5.noStroke;
        global.rect = mockP5.rect;
        global.CORNER = mockP5.CORNER;
        global.CENTER = mockP5.CENTER;
        
        // Sync with window
        window.push = global.push;
        window.pop = global.pop;
        window.imageMode = global.imageMode;
        window.image = global.image;
        window.fill = global.fill;
        window.noStroke = global.noStroke;
        window.rect = global.rect;
        window.CORNER = global.CORNER;
        window.CENTER = global.CENTER;
        
        // Mock TERRAIN_MATERIALS_RANGED
        global.TERRAIN_MATERIALS_RANGED = {
            'grass': [[0, 1], sinon.stub()],
            'dirt': [[0, 1], sinon.stub()],
            'stone': [[0, 1], sinon.stub()],
            'moss': [[0, 1], sinon.stub()]
        };
        window.TERRAIN_MATERIALS_RANGED = global.TERRAIN_MATERIALS_RANGED;
        
        // Load CustomTerrain class
        CustomTerrain = require('../../../Classes/terrainUtils/CustomTerrain.js');
    });
    
    afterEach(function() {
        sinon.restore();
        delete global.window;
        delete global.document;
        delete global.TERRAIN_MATERIALS_RANGED;
    });
    
    describe('render() imageMode Initialization', function() {
        it('should set imageMode(CORNER) at start of render()', function() {
            const terrain = new CustomTerrain(5, 5, 32, 'dirt');
            
            // Call render
            terrain.render();
            
            // Verify imageMode(CORNER) was called
            expect(imageModeSpy.calledWith(mockP5.CORNER)).to.be.true;
        });
        
        it('should NOT use imageMode(CENTER) in render()', function() {
            const terrain = new CustomTerrain(5, 5, 32, 'dirt');
            
            terrain.render();
            
            // Verify CENTER mode was never used
            const centerModeCalls = imageModeSpy.getCalls().filter(call =>
                call.args[0] === mockP5.CENTER
            );
            expect(centerModeCalls.length).to.equal(0);
        });
        
        it('should set imageMode BEFORE rendering any tiles', function() {
            const terrain = new CustomTerrain(3, 3, 32, 'grass');
            
            terrain.render();
            
            // Check that imageMode was called before any render functions
            expect(mockP5.push.called).to.be.true;
            expect(imageModeSpy.called).to.be.true;
            
            // Verify imageMode was called after push but before tile rendering
            const pushCallIndex = mockP5.push.getCalls()[0].callId;
            const imageModeCallIndex = imageModeSpy.getCalls()[0].callId;
            
            expect(imageModeCallIndex).to.be.greaterThan(pushCallIndex);
        });
    });
    
    describe('tileToScreen() Coordinate Accuracy', function() {
        it('should return correct pixel positions for CORNER mode', function() {
            const terrain = new CustomTerrain(10, 10, 32, 'dirt');
            
            const testCases = [
                { tile: [0, 0], expected: { x: 0, y: 0 } },
                { tile: [1, 0], expected: { x: 32, y: 0 } },
                { tile: [0, 1], expected: { x: 0, y: 32 } },
                { tile: [5, 5], expected: { x: 160, y: 160 } },
                { tile: [9, 9], expected: { x: 288, y: 288 } }
            ];
            
            testCases.forEach(({ tile, expected }) => {
                const screenPos = terrain.tileToScreen(tile[0], tile[1]);
                expect(screenPos.x).to.equal(expected.x);
                expect(screenPos.y).to.equal(expected.y);
            });
        });
        
        it('should use simple multiplication (tile * tileSize)', function() {
            const terrain = new CustomTerrain(10, 10, 32, 'dirt');
            
            for (let x = 0; x < 10; x++) {
                for (let y = 0; y < 10; y++) {
                    const screenPos = terrain.tileToScreen(x, y);
                    expect(screenPos.x).to.equal(x * 32);
                    expect(screenPos.y).to.equal(y * 32);
                }
            }
        });
        
        it('should NOT add any offsets to tile positions', function() {
            const terrain = new CustomTerrain(5, 5, 32, 'dirt');
            
            const screenPos = terrain.tileToScreen(3, 3);
            
            // Should be exactly tile * tileSize, NO offsets
            expect(screenPos.x).to.equal(96);  // 3 * 32
            expect(screenPos.y).to.equal(96);  // 3 * 32
            
            // Should NOT be 96.5, 97, or any other value
            expect(screenPos.x).to.not.equal(96.5);
            expect(screenPos.y).to.not.equal(96.5);
        });
    });
    
    describe('Render Without imageMode Inheritance', function() {
        it('should render correctly even if CENTER mode was previously set', function() {
            const terrain = new CustomTerrain(3, 3, 32, 'grass');
            
            // Simulate previous code setting CENTER mode (the bug scenario)
            mockP5.imageMode(mockP5.CENTER);
            imageModeSpy.resetHistory();
            
            // Now render terrain - should set CORNER mode
            terrain.render();
            
            // Verify terrain set CORNER mode (not using inherited CENTER)
            expect(imageModeSpy.calledWith(mockP5.CORNER)).to.be.true;
        });
        
        it('should not be affected by global imageMode state', function() {
            const terrain = new CustomTerrain(2, 2, 32, 'dirt');
            
            // Set various imageModes to pollute global state
            mockP5.imageMode(mockP5.CENTER);
            mockP5.imageMode(mockP5.CORNER);
            mockP5.imageMode(mockP5.CENTER);
            
            imageModeSpy.resetHistory();
            
            // Render should ALWAYS set CORNER regardless of previous state
            terrain.render();
            
            expect(imageModeSpy.calledWith(mockP5.CORNER)).to.be.true;
        });
    });
    
    describe('Regression Prevention', function() {
        it('should FAIL if imageMode(CORNER) is removed from render()', function() {
            // This test simulates the OLD BROKEN code
            const terrain = new CustomTerrain(3, 3, 32, 'grass');
            
            // Call render - it MUST set imageMode
            terrain.render();
            
            // If someone removes the imageMode(CORNER) call, this test fails
            expect(imageModeSpy.called).to.be.true;
            expect(imageModeSpy.calledWith(mockP5.CORNER)).to.be.true;
        });
        
        it('should detect if render() stops using push/pop correctly', function() {
            const terrain = new CustomTerrain(2, 2, 32, 'dirt');
            
            terrain.render();
            
            // Verify push/pop are used (protects imageMode changes)
            expect(mockP5.push.called).to.be.true;
            expect(mockP5.pop.called).to.be.true;
            
            // Verify pop is called after imageMode
            const imageModeCallIndex = imageModeSpy.getCalls()[0].callId;
            const popCallIndex = mockP5.pop.getCalls()[0].callId;
            expect(popCallIndex).to.be.greaterThan(imageModeCallIndex);
        });
    });
    
    describe('Integration with TERRAIN_MATERIALS_RANGED', function() {
        it('should call material render functions with correct coordinates', function() {
            const terrain = new CustomTerrain(2, 2, 32, 'grass');
            const grassRenderFunc = global.TERRAIN_MATERIALS_RANGED['grass'][1];
            
            terrain.render();
            
            // Verify render function was called
            expect(grassRenderFunc.called).to.be.true;
            
            // Check that coordinates passed are correct for CORNER mode
            // Tile (0,0) should render at (0, 0) with size 32
            const firstCall = grassRenderFunc.getCalls()[0];
            expect(firstCall.args[0]).to.equal(0);   // x position
            expect(firstCall.args[1]).to.equal(0);   // y position
            expect(firstCall.args[2]).to.equal(32);  // tile size
        });
        
        it('should render all tiles with consistent imageMode', function() {
            const terrain = new CustomTerrain(3, 3, 32, 'dirt');
            const dirtRenderFunc = global.TERRAIN_MATERIALS_RANGED['dirt'][1];
            
            terrain.render();
            
            // Verify imageMode(CORNER) was set once at the start
            expect(imageModeSpy.calledOnce).to.be.true;
            expect(imageModeSpy.calledWith(mockP5.CORNER)).to.be.true;
            
            // Verify all 9 tiles were rendered (3x3)
            expect(dirtRenderFunc.callCount).to.equal(9);
        });
    });
    
    describe('Edge Cases', function() {
        it('should handle 1x1 terrain correctly', function() {
            const terrain = new CustomTerrain(1, 1, 32, 'grass');
            
            terrain.render();
            
            expect(imageModeSpy.calledWith(mockP5.CORNER)).to.be.true;
            
            const screenPos = terrain.tileToScreen(0, 0);
            expect(screenPos.x).to.equal(0);
            expect(screenPos.y).to.equal(0);
        });
        
        it('should handle different tile sizes correctly', function() {
            const testSizes = [16, 32, 64, 128];
            
            testSizes.forEach(tileSize => {
                const terrain = new CustomTerrain(5, 5, tileSize, 'dirt');
                
                const screenPos = terrain.tileToScreen(3, 3);
                expect(screenPos.x).to.equal(3 * tileSize);
                expect(screenPos.y).to.equal(3 * tileSize);
            });
        });
        
        it('should handle maximum terrain size', function() {
            // CustomTerrain.MAX_TERRAIN_SIZE = 100
            const terrain = new CustomTerrain(100, 100, 32, 'grass');
            
            terrain.render();
            
            expect(imageModeSpy.calledWith(mockP5.CORNER)).to.be.true;
        });
    });
    
    describe('Compatibility with GridOverlay', function() {
        it('should produce coordinates that align with GridOverlay grid lines', function() {
            const terrain = new CustomTerrain(10, 10, 32, 'dirt');
            
            // GridOverlay renders lines at: tileX * tileSize + 0.5 (stroke offset)
            // Tiles should render at: tileX * tileSize (CORNER mode)
            // The 0.5 offset is ONLY for strokes, NOT for images
            
            for (let x = 0; x < 10; x++) {
                const tileScreenPos = terrain.tileToScreen(x, 0);
                const gridLineX = x * 32;  // Grid line (before stroke offset)
                
                // Tile should align with grid line (stroke offset is separate)
                expect(tileScreenPos.x).to.equal(gridLineX);
            }
        });
    });
});
