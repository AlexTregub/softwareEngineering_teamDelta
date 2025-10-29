/**
 * Unit tests for CustomTerrain
 * A simplified terrain system designed specifically for the Level Editor
 */

const assert = require('assert');
const { describe, it, beforeEach } = require('mocha');
const vm = require('vm');
const fs = require('fs');
const path = require('path');

describe('CustomTerrain', function() {
    let CustomTerrain;
    let terrain;

    before(function() {
        // Create a minimal test environment
        const context = {
            console: console,
            module: { exports: {} },
            require: require,
            floor: Math.floor,
            ceil: Math.ceil,
            TILE_SIZE: 32
        };
        vm.createContext(context);

        // Load CustomTerrain class
        const customTerrainPath = path.join(__dirname, '../../../Classes/terrainUtils/CustomTerrain.js');
        const customTerrainCode = fs.readFileSync(customTerrainPath, 'utf8');
        vm.runInContext(customTerrainCode, context);
        CustomTerrain = context.module.exports;
    });

    beforeEach(function() {
        // Create a small 3x3 terrain for testing
        terrain = new CustomTerrain(3, 3, 32);
    });

    describe('Constructor', function() {
        it('should create terrain with correct dimensions', function() {
            assert.strictEqual(terrain.width, 3);
            assert.strictEqual(terrain.height, 3);
            assert.strictEqual(terrain.tileSize, 32);
        });

        it('should initialize all tiles with default material', function() {
            const defaultMaterial = terrain.getDefaultMaterial();
            for (let y = 0; y < terrain.height; y++) {
                for (let x = 0; x < terrain.width; x++) {
                    const tile = terrain.getTile(x, y);
                    assert.strictEqual(tile.material, defaultMaterial);
                }
            }
        });

        it('should create terrain with custom default material', function() {
            const customTerrain = new CustomTerrain(2, 2, 32, 'grass');
            const tile = customTerrain.getTile(0, 0);
            assert.strictEqual(tile.material, 'grass');
        });

        it('should calculate correct pixel dimensions', function() {
            assert.strictEqual(terrain.getPixelWidth(), 3 * 32);
            assert.strictEqual(terrain.getPixelHeight(), 3 * 32);
        });
    });

    describe('getTile', function() {
        it('should get tile at valid coordinates', function() {
            const tile = terrain.getTile(1, 1);
            assert.ok(tile);
            assert.strictEqual(tile.x, 1);
            assert.strictEqual(tile.y, 1);
        });

        it('should return null for out of bounds coordinates', function() {
            assert.strictEqual(terrain.getTile(-1, 0), null);
            assert.strictEqual(terrain.getTile(0, -1), null);
            assert.strictEqual(terrain.getTile(3, 0), null);
            assert.strictEqual(terrain.getTile(0, 3), null);
        });

        it('should return null for non-integer coordinates', function() {
            assert.strictEqual(terrain.getTile(1.5, 1), null);
            assert.strictEqual(terrain.getTile(1, 1.5), null);
        });
    });

    describe('setTile', function() {
        it('should set tile material at valid coordinates', function() {
            const result = terrain.setTile(1, 1, 'stone');
            assert.strictEqual(result, true);
            assert.strictEqual(terrain.getTile(1, 1).material, 'stone');
        });

        it('should return false for out of bounds coordinates', function() {
            assert.strictEqual(terrain.setTile(-1, 0, 'stone'), false);
            assert.strictEqual(terrain.setTile(0, -1, 'stone'), false);
            assert.strictEqual(terrain.setTile(3, 0, 'stone'), false);
            assert.strictEqual(terrain.setTile(0, 3, 'stone'), false);
        });

        it('should update tile properties', function() {
            terrain.setTile(0, 0, 'grass', { weight: 1, passable: true });
            const tile = terrain.getTile(0, 0);
            assert.strictEqual(tile.material, 'grass');
            assert.strictEqual(tile.weight, 1);
            assert.strictEqual(tile.passable, true);
        });
    });

    describe('fill', function() {
        it('should fill entire terrain with material', function() {
            terrain.fill('grass');
            for (let y = 0; y < terrain.height; y++) {
                for (let x = 0; x < terrain.width; x++) {
                    assert.strictEqual(terrain.getTile(x, y).material, 'grass');
                }
            }
        });

        it('should fill rectangular region', function() {
            terrain.fill('stone', 0, 0, 2, 2);
            assert.strictEqual(terrain.getTile(0, 0).material, 'stone');
            assert.strictEqual(terrain.getTile(1, 1).material, 'stone');
            assert.strictEqual(terrain.getTile(2, 2).material, 'dirt'); // Outside region
        });

        it('should clip fill region to terrain bounds', function() {
            terrain.fill('grass', -1, -1, 10, 10);
            // Should not throw, just clip to valid area
            assert.strictEqual(terrain.getTile(0, 0).material, 'grass');
            assert.strictEqual(terrain.getTile(2, 2).material, 'grass');
        });
    });

    describe('clear', function() {
        it('should reset all tiles to default material', function() {
            terrain.setTile(0, 0, 'grass');
            terrain.setTile(1, 1, 'stone');
            terrain.clear();
            
            const defaultMaterial = terrain.getDefaultMaterial();
            for (let y = 0; y < terrain.height; y++) {
                for (let x = 0; x < terrain.width; x++) {
                    assert.strictEqual(terrain.getTile(x, y).material, defaultMaterial);
                }
            }
        });

        it('should clear to custom material', function() {
            terrain.clear('grass');
            for (let y = 0; y < terrain.height; y++) {
                for (let x = 0; x < terrain.width; x++) {
                    assert.strictEqual(terrain.getTile(x, y).material, 'grass');
                }
            }
        });
    });

    describe('screenToTile', function() {
        it('should convert screen coordinates to tile coordinates', function() {
            const tile = terrain.screenToTile(64, 96);
            assert.strictEqual(tile.x, 2);
            assert.strictEqual(tile.y, 3);
        });

        it('should handle negative coordinates', function() {
            const tile = terrain.screenToTile(-10, -10);
            assert.strictEqual(tile.x, -1);
            assert.strictEqual(tile.y, -1);
        });

        it('should return integer coordinates', function() {
            const tile = terrain.screenToTile(50, 50);
            assert.strictEqual(Math.floor(tile.x), tile.x);
            assert.strictEqual(Math.floor(tile.y), tile.y);
        });
    });

    describe('tileToScreen', function() {
        it('should convert tile coordinates to screen coordinates', function() {
            const screen = terrain.tileToScreen(2, 3);
            assert.strictEqual(screen.x, 64);
            assert.strictEqual(screen.y, 96);
        });

        it('should handle negative tile coordinates', function() {
            const screen = terrain.tileToScreen(-1, -1);
            assert.strictEqual(screen.x, -32);
            assert.strictEqual(screen.y, -32);
        });
    });

    describe('isInBounds', function() {
        it('should return true for valid coordinates', function() {
            assert.strictEqual(terrain.isInBounds(0, 0), true);
            assert.strictEqual(terrain.isInBounds(2, 2), true);
            assert.strictEqual(terrain.isInBounds(1, 1), true);
        });

        it('should return false for out of bounds coordinates', function() {
            assert.strictEqual(terrain.isInBounds(-1, 0), false);
            assert.strictEqual(terrain.isInBounds(0, -1), false);
            assert.strictEqual(terrain.isInBounds(3, 0), false);
            assert.strictEqual(terrain.isInBounds(0, 3), false);
        });

        it('should return false for non-integer coordinates', function() {
            assert.strictEqual(terrain.isInBounds(1.5, 1), false);
            assert.strictEqual(terrain.isInBounds(1, 1.5), false);
        });
    });

    describe('getMaterialCount', function() {
        it('should count materials correctly', function() {
            terrain.fill('dirt');
            terrain.setTile(0, 0, 'grass');
            terrain.setTile(1, 1, 'grass');
            terrain.setTile(2, 2, 'stone');

            const counts = terrain.getMaterialCount();
            assert.strictEqual(counts.grass, 2);
            assert.strictEqual(counts.stone, 1);
            assert.strictEqual(counts.dirt, 6); // 9 total - 3 others
        });

        it('should return empty object for empty terrain', function() {
            const emptyTerrain = new CustomTerrain(0, 0, 32);
            const counts = emptyTerrain.getMaterialCount();
            assert.strictEqual(Object.keys(counts).length, 0);
        });
    });

    describe('getDiversity', function() {
        it('should calculate diversity correctly', function() {
            terrain.fill('dirt');
            assert.strictEqual(terrain.getDiversity(), 1);

            terrain.setTile(0, 0, 'grass');
            terrain.setTile(1, 1, 'stone');
            assert.strictEqual(terrain.getDiversity(), 3); // dirt, grass, stone
        });

        it('should return 0 for empty terrain', function() {
            const emptyTerrain = new CustomTerrain(0, 0, 32);
            assert.strictEqual(emptyTerrain.getDiversity(), 0);
        });
    });

    describe('resize', function() {
        it('should expand terrain with default material', function() {
            terrain.resize(5, 5);
            assert.strictEqual(terrain.width, 5);
            assert.strictEqual(terrain.height, 5);
            
            const defaultMaterial = terrain.getDefaultMaterial();
            assert.strictEqual(terrain.getTile(4, 4).material, defaultMaterial);
        });

        it('should preserve existing tiles when expanding', function() {
            terrain.setTile(0, 0, 'grass');
            terrain.setTile(2, 2, 'stone');
            
            terrain.resize(5, 5);
            
            assert.strictEqual(terrain.getTile(0, 0).material, 'grass');
            assert.strictEqual(terrain.getTile(2, 2).material, 'stone');
        });

        it('should shrink terrain and discard out of bounds tiles', function() {
            terrain.setTile(0, 0, 'grass');
            terrain.setTile(2, 2, 'stone');
            
            terrain.resize(2, 2);
            
            assert.strictEqual(terrain.width, 2);
            assert.strictEqual(terrain.height, 2);
            assert.strictEqual(terrain.getTile(0, 0).material, 'grass');
            assert.strictEqual(terrain.getTile(2, 2), null); // Out of bounds now
        });
    });

    describe('clone', function() {
        it('should create independent copy of terrain', function() {
            terrain.setTile(1, 1, 'grass');
            const clone = terrain.clone();
            
            assert.strictEqual(clone.width, terrain.width);
            assert.strictEqual(clone.height, terrain.height);
            assert.strictEqual(clone.getTile(1, 1).material, 'grass');
            
            // Modify original
            terrain.setTile(1, 1, 'stone');
            
            // Clone should be unchanged
            assert.strictEqual(clone.getTile(1, 1).material, 'grass');
        });
    });

    describe('toJSON', function() {
        it('should serialize terrain to JSON', function() {
            terrain.setTile(0, 0, 'grass');
            terrain.setTile(1, 1, 'stone');
            
            const json = terrain.toJSON();
            
            assert.strictEqual(json.width, 3);
            assert.strictEqual(json.height, 3);
            assert.strictEqual(json.tileSize, 32);
            assert.ok(Array.isArray(json.tiles));
            assert.strictEqual(json.tiles.length, 9);
        });

        it('should include tile data in JSON', function() {
            terrain.setTile(0, 0, 'grass');
            const json = terrain.toJSON();
            
            const grassTile = json.tiles.find(t => t.x === 0 && t.y === 0);
            assert.strictEqual(grassTile.material, 'grass');
        });
    });

    describe('fromJSON', function() {
        it('should restore terrain from JSON', function() {
            terrain.setTile(0, 0, 'grass');
            terrain.setTile(1, 1, 'stone');
            
            const json = terrain.toJSON();
            const restored = CustomTerrain.fromJSON(json);
            
            assert.strictEqual(restored.width, terrain.width);
            assert.strictEqual(restored.height, terrain.height);
            assert.strictEqual(restored.getTile(0, 0).material, 'grass');
            assert.strictEqual(restored.getTile(1, 1).material, 'stone');
        });

        it('should handle empty terrain', function() {
            const emptyTerrain = new CustomTerrain(0, 0, 32);
            const json = emptyTerrain.toJSON();
            const restored = CustomTerrain.fromJSON(json);
            
            assert.strictEqual(restored.width, 0);
            assert.strictEqual(restored.height, 0);
        });
    });
});
