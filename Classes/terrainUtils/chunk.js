///// CHUNK of TERRAIN made of GRID of TILES
const CHUNK_SIZE=8; // size in Tiles

class Chunk {
    constructor(chunkPos,spanTLPos,size=CHUNK_SIZE,tileSize=TILE_SIZE) {
        tileData = new Grid(size,size,spanTLPos,chunkPos); // Public, can access through chunk.tileData.*

        // Fill grid with Tile:
        let len = size*size;
        for (let i = 0; i < len; ++i) {
            let gridPos = tileData.convArrToRelPos(tileData.convToSquare(i)); // i -> square -> span
            tileData.rawArray[i] = new Tile(gridPos[0],gridPos[1],tileSize); // Now storing GRID position, instead of PIXEL position. Raw access for efficiency
        }
    }

    randomize(seed) {
        // Set chunk-seed (arbitrary, ideally shouldnt have collision)
        randomSeed(
            // sign(x)((seed^x)/y) for chunkPos x,y .
            Math.sign(tileData.getObjPos()[0])*pow(seed,abs(tileData.getObjPos()[0]))/tileData.getObjPos()[1]
        );

        let width = tileData.getSize()[0]; // ASSUMED SQUARE
        let len = width*width;
        for (let i = 0; i < len; ++i) {
            tileData.rawArray[i].randomizeLegacy(); // Picks from random material
        }

        // Dirt clustering -> not of latest method, using previous idea of neighbors
        for (let i = 0; i < len; ++i) {
            let iPos = tileData.convToSquare(i);
            let countDirt = 0;

            // Get 4 neighbors, without OOB
            if (iPos[0]+1 < width && iPos[0] >= 0) {
                if (tileData.getArrPos(iPos[0]+1,iPos[1]).getMaterial() == 'dirt') {
                    ++countDirt;
                }
            }
            if (iPos[0]-1 < width && iPos[0] >= 0) {
                if (tileData.getArrPos(iPos[0]-1,iPos[1]).getMaterial() == 'dirt') {
                    ++countDirt;
                }
            }
            if (iPos[1]+1 < width && iPos[1] >= 0) {
                if (tileData.getArrPos(iPos[0],iPos[1]+1).getMaterial() == 'dirt') {
                    ++countDirt;
                }
            }
            if (iPos[1]-1 < width && iPos[1] >= 0) {
                if (tileData.getArrPos(iPos[0],iPos[1]-1).getMaterial() == 'dirt') {
                    ++countDirt;
                }
            }

            if (random() < (countDirt/4)) {
                tileData.rawArray[i].setMaterial('dirt');
            }
        }
    }
}