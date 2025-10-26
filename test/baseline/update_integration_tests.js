const fs = require('fs');

const content = fs.readFileSync('test/integration/ui/terrainUI.integration.test.js', 'utf8');

// Replace mockTerrain declarations with CustomTerrain
let updated = content.replace(/const mockTerrain = \{[\s\S]*?\};/g, (match) => {
    // Only replace the mock terrain objects, not other code
    if (match.includes('gridSize') && match.includes('grid:') && match.includes('getArrPos')) {
        return "const terrain = new CustomTerrain(10, 10, 32, 'moss');";
    }
    return match;
});

// Replace mockTerrain references with terrain
updated = updated.replace(/mockTerrain/g, 'terrain');

// Replace .grid[index] = 'material' with setTile calls
updated = updated.replace(/terrain\.grid\[(\d+)\]\s*=\s*'(\w+)';/g, (match, index, material) => {
    const x = parseInt(index) % 10;
    const y = Math.floor(parseInt(index) / 10);
    return `terrain.setTile(${x}, ${y}, '${material}');`;
});

// Replace .getArrPos(x, y) with .getTile(x, y).material
updated = updated.replace(/terrain\.getArrPos\((\d+),\s*(\d+)\)/g, 'terrain.getTile($1, $2).material');

fs.writeFileSync('test/integration/ui/terrainUI.integration.test.js', updated);
console.log('✅ Updated all tests to use CustomTerrain');
console.log('   - Replaced mockTerrain with CustomTerrain instances');
console.log('   - Updated .getArrPos() to .getTile().material');
console.log('   - Converted direct grid access to .setTile()');
