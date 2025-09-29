///// CHUNK of TERRAIN made of GRID of TILES
const CHUNK_SIZE=8; // size in Tiles

class Chunk {
    constructor(chunkPos,spanTLPos,size=CHUNK_SIZE,tileSize=TILE_SIZE) { // spanTLPos should be a known rounded value. We will automatically offset items as needed. 
        this.tileData = new Grid(size,size,spanTLPos,chunkPos); // Public, can access through chunk.tileData.*

        // Fill grid with Tile:
        let len = size*size;
        for (let i = 0; i < len; ++i) {
            let gridPos = this.tileData.convArrToRelPos(this.tileData.convToSquare(i)); // i -> square -> span
            this.tileData.rawArray[i] = new Tile(gridPos[0]-0.5,gridPos[1]-0.5,tileSize); // Now storing GRID-RENDER position TL render corner (offset), instead of PIXEL position. Raw access for efficiency
        }
    }

    randomize(posOffset) {
        // Set chunk-seed (arbitrary, ideally shouldnt have collision)
        // randomSeed(
        //     // sign(x)((seed^x)/y) for chunkPos x,y .
        //     Math.sign(this.tileData.getObjPos()[0])*pow(seed,abs(this.tileData.getObjPos()[0])+0.5)/(this.tileData.getObjPos()[1]+0.5)
        // );

        let width = this.tileData.getSize()[0]; // ASSUMED SQUARE
        let len = width*width;
        for (let i = 0; i < len; ++i) {
            let position = this.tileData.convArrToRelPos(this.tileData.convToSquare(i));
            // print(position);
            position = [
                position[0] + posOffset[0],
                position[1] + posOffset[1]
            ]
            this.tileData.rawArray[i].randomizePerlin(position); // Picks from random material
            // print(this.tileData.getSpanRange());
        }

        // Dirt clustering -> not of latest method, using previous idea of neighbors
        // for (let i = 0; i < len; ++i) {
        //     let iPos = this.tileData.convToSquare(i);
        //     let countDirt = 0;

        //     // Get 4 neighbors, without OOB
        //     if (iPos[0]+1 < width && iPos[0]+1 >= 0) {
        //         if (this.tileData.getArrPos([iPos[0]+1,iPos[1]]).getMaterial() == 'dirt') {
        //             ++countDirt;
        //         }
        //     }
        //     if (iPos[0]-1 < width && iPos[0]-1 >= 0) {
        //         if (this.tileData.getArrPos([iPos[0]-1,iPos[1]]).getMaterial() == 'dirt') {
        //             ++countDirt;
        //         }
        //     }
        //     if (iPos[1]+1 < width && iPos[1]+1 >= 0) {
        //         if (this.tileData.getArrPos([iPos[0],iPos[1]+1]).getMaterial() == 'dirt') {
        //             ++countDirt;
        //         }
        //     }
        //     if (iPos[1]-1 < width && iPos[1]-1 >= 0) {
        //         if (this.tileData.getArrPos([iPos[0],iPos[1]-1]).getMaterial() == 'dirt') {
        //             ++countDirt;
        //         }
        //     }

        //     if (random() < (countDirt/4)) {
        //         this.tileData.rawArray[i].setMaterial('dirt');
        //     }
        // }
    }

    render(coordSys) { // Render through coordinate system
        // let temp = coordSys;
        // coordSys.setViewCornerBC([0,0]);
        let len = this.tileData.getSize()[0]*this.tileData.getSize()[1];
        
        for (let i = 0; i < len; ++i) {
            this.tileData.rawArray[i].render2(coordSys);
        }
    }
}