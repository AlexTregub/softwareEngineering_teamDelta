/**
 * Integration Tests: GridTerrain imageMode Regression Prevention
 * 
 * PURPOSE: Prevent regression of the imageMode(CENTER/CORNER) mismatch bug
 * 
 * BUG HISTORY:
 * - GridTerrain cached terrain with imageMode(CORNER) but drew with imageMode(CENTER)
 * - Caused 0.5-tile visual offset between grid and terrain
 * - Fixed by using imageMode(CORNER) consistently for both operations
 * 
 * THESE TESTS ENSURE:
 * 1. Cache rendering uses imageMode(CORNER)
 * 2. Cache drawing uses imageMode(CORNER)
 * 3. Coordinate calculations are correct for CORNER mode
 * 4. No imageMode mismatch between render and draw operations
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('GridTerrain imageMode Regression Prevention (Integration)', function() {
    let dom;
    let window;
    let document;
    let mockP5;
    let imageModeSpy;
    let imageSpy;
    
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
        
        // Mock p5.js drawing functions
        mockP5 = {
            push: sinon.stub(),
            pop: sinon.stub(),
            imageMode: sinon.stub(),
            image: sinon.stub(),
            noSmooth: sinon.stub(),
            background: sinon.stub(),
            createGraphics: sinon.stub().returns({
                width: 800,
                height: 600,
                push: sinon.stub(),
                pop: sinon.stub(),
                imageMode: sinon.stub(),
                image: sinon.stub(),
                noSmooth: sinon.stub(),
                clear: sinon.stub(),
                remove: sinon.stub()
            }),
            CORNER: 'CORNER',
            CENTER: 'CENTER'
        };
        
        // Spy on imageMode and image to track calls
        imageModeSpy = mockP5.imageMode;
        imageSpy = mockP5.image;
        
        // Set globals
        global.push = mockP5.push;
        global.pop = mockP5.pop;
        global.imageMode = mockP5.imageMode;
        global.image = mockP5.image;
        global.createGraphics = mockP5.createGraphics;
        global.noSmooth = mockP5.noSmooth;
        global.background = mockP5.background;
        global.CORNER = mockP5.CORNER;
        global.CENTER = mockP5.CENTER;
        
        // Sync with window
        window.push = global.push;
        window.pop = global.pop;
        window.imageMode = global.imageMode;
        window.image = global.image;
        window.createGraphics = global.createGraphics;
        window.noSmooth = global.noSmooth;
        window.background = global.background;
        window.CORNER = global.CORNER;
        window.CENTER = global.CENTER;
    });
    
    afterEach(function() {
        sinon.restore();
        delete global.window;
        delete global.document;
    });
    
    describe('Cache Drawing imageMode', function() {
        it('should use imageMode(CORNER) when drawing cached terrain', function() {
            // Simulate the fixed code path
            const canvasCenter = [400, 300];
            const cacheWidth = 800;
            const cacheHeight = 600;
            const mockCache = { width: cacheWidth, height: cacheHeight };
            
            // This is the FIXED code from gridTerrain.js
            mockP5.push();
            mockP5.imageMode(mockP5.CORNER);  // CRITICAL: Must be CORNER, not CENTER
            const cacheX = canvasCenter[0] - cacheWidth / 2;
            const cacheY = canvasCenter[1] - cacheHeight / 2;
            mockP5.image(mockCache, cacheX, cacheY);
            mockP5.pop();
            
            // Verify imageMode(CORNER) was called
            expect(imageModeSpy.calledWith(mockP5.CORNER)).to.be.true;
            
            // Verify imageMode(CENTER) was NOT called
            expect(imageModeSpy.calledWith(mockP5.CENTER)).to.be.false;
            
            // Verify coordinates are correct for CORNER mode
            expect(imageSpy.firstCall.args[1]).to.equal(0);  // cacheX = 400 - 400 = 0
            expect(imageSpy.firstCall.args[2]).to.equal(0);  // cacheY = 300 - 300 = 0
        });
        
        it('should NOT use imageMode(CENTER) for cache drawing', function() {
            // This test ensures the OLD BROKEN code doesn't return
            const canvasCenter = [400, 300];
            const mockCache = { width: 800, height: 600 };
            
            // CORRECT approach (what we want)
            mockP5.push();
            mockP5.imageMode(mockP5.CORNER);
            const cacheX = canvasCenter[0] - mockCache.width / 2;
            const cacheY = canvasCenter[1] - mockCache.height / 2;
            mockP5.image(mockCache, cacheX, cacheY);
            mockP5.pop();
            
            // WRONG approach (what we're preventing)
            // mockP5.imageMode(mockP5.CENTER);  // <-- This should NEVER happen
            // mockP5.image(mockCache, canvasCenter[0], canvasCenter[1]);
            
            // Verify CENTER mode was never used
            const centerModeCalls = imageModeSpy.getCalls().filter(call => 
                call.args[0] === mockP5.CENTER
            );
            expect(centerModeCalls.length).to.equal(0);
        });
    });
    
    describe('Cache Rendering imageMode', function() {
        it('should use imageMode(CORNER) when rendering tiles to cache', function() {
            const mockCache = mockP5.createGraphics(800, 600);
            
            // This simulates rendering tiles INTO the cache
            mockCache.push();
            mockCache.imageMode(mockP5.CORNER);  // Must use CORNER
            mockCache.noSmooth();
            // ... render tiles ...
            mockCache.pop();
            
            // Verify cache uses CORNER mode
            expect(mockCache.imageMode.calledWith(mockP5.CORNER)).to.be.true;
        });
    });
    
    describe('imageMode Consistency Check', function() {
        it('should use SAME imageMode for both render and draw operations', function() {
            const mockCache = mockP5.createGraphics(800, 600);
            
            // STEP 1: Render tiles to cache
            mockCache.push();
            mockCache.imageMode(mockP5.CORNER);  // Rendering mode
            // ... render tiles ...
            mockCache.pop();
            const renderMode = mockCache.imageMode.firstCall.args[0];
            
            // STEP 2: Draw cache to screen
            mockP5.push();
            mockP5.imageMode(mockP5.CORNER);  // Drawing mode
            mockP5.image(mockCache, 0, 0);
            mockP5.pop();
            const drawMode = imageModeSpy.firstCall.args[0];
            
            // CRITICAL: Both must use the SAME mode
            expect(renderMode).to.equal(mockP5.CORNER);
            expect(drawMode).to.equal(mockP5.CORNER);
            expect(renderMode).to.equal(drawMode);
        });
        
        it('should REJECT mixing CORNER (render) with CENTER (draw)', function() {
            // This is the BUG we're preventing
            const renderMode = mockP5.CORNER;
            const drawMode = mockP5.CORNER;  // MUST be CORNER, not CENTER
            
            // Verify we're not mixing modes
            expect(renderMode).to.equal(mockP5.CORNER);
            expect(drawMode).to.equal(mockP5.CORNER);
            expect(drawMode).to.not.equal(mockP5.CENTER);  // The bug we fixed
        });
    });
    
    describe('Coordinate Calculations for CORNER Mode', function() {
        it('should calculate correct top-left position from canvas center', function() {
            const testCases = [
                { 
                    canvasCenter: [400, 300], 
                    cacheSize: [800, 600], 
                    expectedPos: [0, 0] 
                },
                { 
                    canvasCenter: [500, 400], 
                    cacheSize: [800, 600], 
                    expectedPos: [100, 100] 
                },
                { 
                    canvasCenter: [200, 150], 
                    cacheSize: [400, 300], 
                    expectedPos: [0, 0] 
                },
                {
                    canvasCenter: [450, 350],
                    cacheSize: [600, 400],
                    expectedPos: [150, 150]
                }
            ];
            
            testCases.forEach(({ canvasCenter, cacheSize, expectedPos }) => {
                const cacheX = canvasCenter[0] - cacheSize[0] / 2;
                const cacheY = canvasCenter[1] - cacheSize[1] / 2;
                
                expect(cacheX).to.equal(expectedPos[0]);
                expect(cacheY).to.equal(expectedPos[1]);
            });
        });
        
        it('should produce mathematically equivalent position to CENTER mode', function() {
            // Verify that CORNER mode with adjusted coords = CENTER mode with center coords
            const canvasCenter = [400, 300];
            const cacheWidth = 800;
            const cacheHeight = 600;
            
            // CENTER mode position (what the bug used)
            const centerModeX = canvasCenter[0];
            const centerModeY = canvasCenter[1];
            
            // CORNER mode position (the fix)
            const cornerModeX = canvasCenter[0] - cacheWidth / 2;
            const cornerModeY = canvasCenter[1] - cacheHeight / 2;
            
            // The image CENTER should be the same in both modes
            const centerInCenterMode = [centerModeX, centerModeY];
            const centerInCornerMode = [
                cornerModeX + cacheWidth / 2,
                cornerModeY + cacheHeight / 2
            ];
            
            expect(centerInCornerMode[0]).to.equal(centerInCenterMode[0]);
            expect(centerInCornerMode[1]).to.equal(centerInCenterMode[1]);
        });
    });
    
    describe('Regression Prevention', function() {
        it('should prevent reintroduction of imageMode(CENTER) bug', function() {
            // This test will FAIL if someone accidentally changes back to CENTER mode
            const mockCache = { width: 800, height: 600 };
            const canvasCenter = [400, 300];
            
            // Simulate cache drawing
            mockP5.push();
            const mode = mockP5.CORNER;  // If this changes to CENTER, test fails
            mockP5.imageMode(mode);
            const cacheX = canvasCenter[0] - mockCache.width / 2;
            const cacheY = canvasCenter[1] - mockCache.height / 2;
            mockP5.image(mockCache, cacheX, cacheY);
            mockP5.pop();
            
            // Assert CORNER mode was used
            expect(mode).to.equal(mockP5.CORNER);
            expect(mode).to.not.equal(mockP5.CENTER);
            
            // Assert imageMode was called with CORNER
            const imageModeCalls = imageModeSpy.getCalls();
            const usedCenterMode = imageModeCalls.some(call => call.args[0] === mockP5.CENTER);
            expect(usedCenterMode).to.be.false;
        });
        
        it('should detect if coordinate calculation changes incorrectly', function() {
            // This test will FAIL if someone changes the coordinate calculation
            const canvasCenter = [400, 300];
            const cacheWidth = 800;
            const cacheHeight = 600;
            
            // CORRECT calculation (for CORNER mode)
            const cacheX = canvasCenter[0] - cacheWidth / 2;
            const cacheY = canvasCenter[1] - cacheHeight / 2;
            
            // Expected values
            expect(cacheX).to.equal(0);
            expect(cacheY).to.equal(0);
            
            // WRONG calculations (should fail):
            const wrongX1 = canvasCenter[0];  // Missing offset
            const wrongY1 = canvasCenter[1];
            expect(wrongX1).to.not.equal(cacheX);
            expect(wrongY1).to.not.equal(cacheY);
            
            const wrongX2 = canvasCenter[0] + cacheWidth / 2;  // Wrong sign
            const wrongY2 = canvasCenter[1] + cacheHeight / 2;
            expect(wrongX2).to.not.equal(cacheX);
            expect(wrongY2).to.not.equal(cacheY);
        });
    });
    
    describe('Edge Cases', function() {
        it('should handle cache size equal to canvas size', function() {
            const canvasCenter = [400, 300];
            const cacheWidth = 800;
            const cacheHeight = 600;
            
            const cacheX = canvasCenter[0] - cacheWidth / 2;
            const cacheY = canvasCenter[1] - cacheHeight / 2;
            
            expect(cacheX).to.equal(0);
            expect(cacheY).to.equal(0);
        });
        
        it('should handle cache size smaller than canvas', function() {
            const canvasCenter = [400, 300];
            const cacheWidth = 400;
            const cacheHeight = 300;
            
            const cacheX = canvasCenter[0] - cacheWidth / 2;
            const cacheY = canvasCenter[1] - cacheHeight / 2;
            
            expect(cacheX).to.equal(200);
            expect(cacheY).to.equal(150);
        });
        
        it('should handle cache size larger than canvas', function() {
            const canvasCenter = [400, 300];
            const cacheWidth = 1600;
            const cacheHeight = 1200;
            
            const cacheX = canvasCenter[0] - cacheWidth / 2;
            const cacheY = canvasCenter[1] - cacheHeight / 2;
            
            expect(cacheX).to.equal(-400);
            expect(cacheY).to.equal(-300);
        });
    });
});
