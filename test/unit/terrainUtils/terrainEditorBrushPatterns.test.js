/**
 * Unit Tests: TerrainEditor Brush Patterns
 * 
 * TDD Phase 1: UNIT TESTS (Write tests FIRST)
 * 
 * Tests that TerrainEditor.paint() uses the correct brush patterns:
 * - Even sizes (2,4,6,8): Circular pattern
 * - Odd sizes (3,5,7,9): Square pattern
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('TerrainEditor Brush Patterns (Unit Tests)', function() {
    let TerrainEditor, mockTerrain, editor;
    
    beforeEach(function() {
        // Load TerrainEditor
        TerrainEditor = require('../../../Classes/terrainUtils/TerrainEditor');
        
        // Create mock terrain
        const tiles = {};
        mockTerrain = {
            _tileSize: 32,
            _gridSizeX: 10,
            _gridSizeY: 10,
            _chunkSize: 10,
            getArrPos: sinon.stub().callsFake(([x, y]) => {
                const key = `${x},${y}`;
                if (!tiles[key]) {
                    tiles[key] = {
                        material: 'dirt',
                        getMaterial: function() { return this.material; },
                        setMaterial: function(mat) { this.material = mat; },
                        assignWeight: sinon.stub()
                    };
                }
                return tiles[key];
            }),
            invalidateCache: sinon.stub()
        };
        
        editor = new TerrainEditor(mockTerrain);
    });
    
    describe('Odd Size 3 - Square Pattern', function() {
        it('should paint 3x3 square (9 tiles) for brush size 3', function() {
            editor.setBrushSize(3);
            editor.selectMaterial('stone');
            
            // Paint at center (10, 10)
            editor.paint(10, 10);
            
            // Verify 9 tiles were painted (3x3 square)
            const paintedTiles = [];
            for (let y = 9; y <= 11; y++) {
                for (let x = 9; x <= 11; x++) {
                    const tile = mockTerrain.getArrPos([x, y]);
                    if (tile.getMaterial() === 'stone') {
                        paintedTiles.push({ x, y });
                    }
                }
            }
            
            expect(paintedTiles.length).to.equal(9, 'Should paint 9 tiles in 3x3 square');
            
            // Verify all corners are painted (square pattern)
            expect(paintedTiles).to.deep.include({ x: 9, y: 9 });   // Top-left
            expect(paintedTiles).to.deep.include({ x: 11, y: 9 });  // Top-right
            expect(paintedTiles).to.deep.include({ x: 9, y: 11 });  // Bottom-left
            expect(paintedTiles).to.deep.include({ x: 11, y: 11 }); // Bottom-right
        });
    });
    
    describe('Even Size 4 - Circular Pattern', function() {
        it('should paint circular pattern (13 tiles) for brush size 4', function() {
            editor.setBrushSize(4);
            editor.selectMaterial('stone');
            
            // Paint at center (10, 10)
            editor.paint(10, 10);
            
            // Count painted tiles
            const paintedTiles = [];
            for (let y = 8; y <= 12; y++) {
                for (let x = 8; x <= 12; x++) {
                    const tile = mockTerrain.getArrPos([x, y]);
                    if (tile.getMaterial() === 'stone') {
                        paintedTiles.push({ x, y });
                    }
                }
            }
            
            // Circular pattern with radius 2 should have ~13 tiles
            expect(paintedTiles.length).to.be.greaterThan(9);
            expect(paintedTiles.length).to.be.lessThanOrEqual(16);
            
            // Center should be painted
            expect(paintedTiles).to.deep.include({ x: 10, y: 10 });
        });
    });
    
    describe('Odd Size 5 - Square Pattern', function() {
        it('should paint 5x5 square (25 tiles) for brush size 5', function() {
            editor.setBrushSize(5);
            editor.selectMaterial('stone');
            
            // Paint at center (10, 10)
            editor.paint(10, 10);
            
            // Verify 25 tiles were painted (5x5 square)
            const paintedTiles = [];
            for (let y = 8; y <= 12; y++) {
                for (let x = 8; x <= 12; x++) {
                    const tile = mockTerrain.getArrPos([x, y]);
                    if (tile.getMaterial() === 'stone') {
                        paintedTiles.push({ x, y });
                    }
                }
            }
            
            expect(paintedTiles.length).to.equal(25, 'Should paint 25 tiles in 5x5 square');
            
            // Verify all corners are painted (square pattern)
            expect(paintedTiles).to.deep.include({ x: 8, y: 8 });   // Top-left
            expect(paintedTiles).to.deep.include({ x: 12, y: 8 });  // Top-right
            expect(paintedTiles).to.deep.include({ x: 8, y: 12 });  // Bottom-left
            expect(paintedTiles).to.deep.include({ x: 12, y: 12 }); // Bottom-right
        });
    });
    
    describe('Even Size 2 - Circular Pattern', function() {
        it('should paint circular pattern (5 tiles cross) for brush size 2', function() {
            editor.setBrushSize(2);
            editor.selectMaterial('stone');
            
            // Paint at center (10, 10)
            editor.paint(10, 10);
            
            // Count painted tiles
            const paintedTiles = [];
            for (let y = 9; y <= 11; y++) {
                for (let x = 9; x <= 11; x++) {
                    const tile = mockTerrain.getArrPos([x, y]);
                    if (tile.getMaterial() === 'stone') {
                        paintedTiles.push({ x, y });
                    }
                }
            }
            
            // Circular pattern with radius 1 creates cross (5 tiles)
            expect(paintedTiles.length).to.equal(5);
            
            // Center + 4 cardinal directions
            expect(paintedTiles).to.deep.include({ x: 10, y: 10 }); // Center
            expect(paintedTiles).to.deep.include({ x: 9, y: 10 });  // Left
            expect(paintedTiles).to.deep.include({ x: 11, y: 10 }); // Right
            expect(paintedTiles).to.deep.include({ x: 10, y: 9 });  // Top
            expect(paintedTiles).to.deep.include({ x: 10, y: 11 }); // Bottom
        });
    });
    
    describe('Size 1 - Single Tile', function() {
        it('should paint single tile for brush size 1', function() {
            editor.setBrushSize(1);
            editor.selectMaterial('stone');
            
            // Paint at (10, 10)
            editor.paint(10, 10);
            
            // Only (10,10) should be painted
            const tile10_10 = mockTerrain.getArrPos([10, 10]);
            expect(tile10_10.getMaterial()).to.equal('stone');
            
            // Adjacent tiles should NOT be painted
            const tile9_10 = mockTerrain.getArrPos([9, 10]);
            expect(tile9_10.getMaterial()).to.equal('dirt');
        });
    });
});
