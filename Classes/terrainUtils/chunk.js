///// CHUNK of TERRAIN made of GRID of TILES
const CHUNK_SIZE=8; // size in Tiles

class Chunk {
    constructor(chunkPos,spanTLPos,size=CHUNK_SIZE,tileSize=TILE_SIZE) { // spanTLPos should be a known rounded value. We will automatically offset items as needed. 
        this._chunkPos = chunkPos;
        this._spanTLPos = spanTLPos;
        this._size = size;
        this._tileSize = tileSize;
        
        this.tileData = new Grid(this._size,this._size,this._spanTLPos,this._chunkPos); // Public, can access through chunk.tileData.*

        // Fill grid with Tile:
        let len = this._size*this._size;
        for (let i = 0; i < len; ++i) {
            let gridPos = this.tileData.convArrToRelPos(this.tileData.convToSquare(i)); // i -> square -> span

            // DEFINES RENDERING OFFSET OF -0.5 - ROUND TO BE USED FOR X,Y POSITION
            this.tileData.rawArray[i] = new Tile(gridPos[0]-0.5,gridPos[1]-0.5,tileSize); // Now storing GRID-RENDER position TL render corner (offset), instead of PIXEL position. Raw access for efficiency
        }
    } // tested

    //// Additional chunk functionality
    randomize(posOffset) { // posOffset used for perlin noise generation - does not take negative values. 
        let width = this.tileData.getSize()[0]; // ASSUMED SQUARE
        let len = width*width;
        for (let i = 0; i < len; ++i) {
            let position = this.tileData.convArrToRelPos(this.tileData.convToSquare(i));
            // print(position);
            position = [ // Ensuring position always positive...
                position[0] + posOffset[0],
                position[1] + posOffset[1]
            ]
            this.tileData.rawArray[i].randomizePerlin(position); // Picks from random material
            // print(this.tileData.getSpanRange());
        }
    } // tested

    /**
     * Apply terrain generation based on mode
     * @param {string} mode - Generation mode ('perlin', 'columns', 'checkerboard', 'flat')
     * @param {Array} chunkPos - Position of this chunk [x, y]
     * @param {Array} tileSpanRange - Global tile span range
     * @param {number} seed - Random seed
     */
    applyGenerationMode(mode, chunkPos, tileSpanRange, seed) {
        switch(mode) {
            case 'perlin':
                // Default perlin noise generation
                // this.randomize(tileSpanRange || [0, 0]);
                // console.log("Randomizing...")
                this.randomize(tileSpanRange);
                break;
                
            case 'columns':
                // Alternating vertical columns of moss and stone
                this.applyColumnPattern(chunkPos);
                break;
                
            case 'checkerboard':
                // Checkerboard pattern of moss and stone
                this.applyCheckerboardPattern(chunkPos);
                break;
                
            case 'flat':
                // Flat terrain (all one material)
                this.applyFlatTerrain('grass');
                break;
                
            case 'blank':
                // Blank terrain for editing (all dirt)
                this.applyFlatTerrain('dirt');
                break;
                
            default:
                console.warn(`Unknown generation mode '${mode}', defaulting to perlin`);
                // this.randomize(tileSpanRange || [0, 0]);
                this.randomize(tileSpanRange);
        }
    } // tested

    /**
     * Apply alternating moss and stone column pattern
     * @param {Array} chunkPos - Position of this chunk [x, y]
     */
    applyColumnPattern(chunkPos) {
        const width = this.tileData.getSize()[0];
        const height = this.tileData.getSize()[1];
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const tileIndex = this.tileData.convToFlat([x, y]);
                const tile = this.tileData.rawArray[tileIndex];
                
                // Calculate absolute X position
                const absoluteX = chunkPos[0] * width + x;
                
                // Even columns = moss, Odd columns = stone
                if (absoluteX % 2 === 0) {
                    // tile._materialSet = 'moss';
                    // tile._weight = 2;

                    tile.setMaterial('moss');
                    tile.assignWeight();
                } else {
                    // tile._materialSet = 'stone';
                    // tile._weight = 100;

                    tile.setMaterial('stone');
                    tile.assignWeight();
                }
            }
        }
    } // tested 

    /**
     * Apply checkerboard pattern
     * @param {Array} chunkPos - Position of this chunk [x, y]
     */
    applyCheckerboardPattern(chunkPos) {
        const width = this.tileData.getSize()[0];
        const height = this.tileData.getSize()[1];
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const tileIndex = this.tileData.convToFlat([x, y]);
                const tile = this.tileData.rawArray[tileIndex];
                
                // Calculate absolute position
                const absoluteX = chunkPos[0] * width + x;
                const absoluteY = chunkPos[1] * height + y;
                
                // Checkerboard: moss if (x+y) even, stone if odd
                if ((absoluteX + absoluteY) % 2 === 0) {
                    // tile._materialSet = 'moss';
                    // tile._weight = 2;

                    tile.setMaterial('moss');
                    tile.assignWeight();
                } else {
                    // tile._materialSet = 'stone';
                    // tile._weight = 100;

                    tile.setMaterial('stone');
                    tile.assignWeight();
                }
            }
        }
    } // tested

    /**
     * Apply flat terrain (all one material)
     * @param {string} material - Material name to fill with
     */
    applyFlatTerrain(material = 'grass') {
        const width = this.tileData.getSize()[0];
        const height = this.tileData.getSize()[1];
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const tileIndex = this.tileData.convToFlat([x, y]);
                const tile = this.tileData.rawArray[tileIndex];
                
                // tile._materialSet = material;
                if (!tile.setMaterial(material)) {
                    console.log("INVALID MATERIAL SET IN Chunk->applyFlatTerrain.")
                }
                
                // Set appropriate weight
                tile.assignWeight();
                // if (material === 'grass') {
                //     tile._weight = 1;
                // } else if (material === 'dirt') {
                //     tile._weight = 3;
                // } else if (material === 'stone') {
                //     tile._weight = 100;
                // } else if (material === 'moss' || material === 'moss_1') {
                //     tile._weight = 2;
                // } else {
                //     tile._weight = 1;
                // }
            }
        }
    } // tested

    render(coordSys,ctx=window) { // Render through coordinate system
        // let temp = coordSys;
        // coordSys.setViewCornerBC([0,0]);
        let len = this.tileData.getSize()[0]*this.tileData.getSize()[1];
        
        for (let i = 0; i < len; ++i) {
            this.tileData.rawArray[i].render(coordSys,ctx);
        }
    } // tested

    // Reset, properties kept.
    clear() {
        this.tileData.clear();

        this.tileData = new Grid(this._size,this._size,this._spanTLPos,this._chunkPos); // Public, can access through chunk.tileData.*

        // Fill grid with Tile:
        let len = this._size*this._size;
        for (let i = 0; i < len; ++i) {
            let gridPos = this.tileData.convArrToRelPos(this.tileData.convToSquare(i)); // i -> square -> span
            this.tileData.rawArray[i] = new Tile(gridPos[0]-0.5,gridPos[1]-0.5,tileSize); // Now storing GRID-RENDER position TL render corner (offset), instead of PIXEL position. Raw access for efficiency
        }
    } // tested

    //////// Passed through Grid functions - TESTED EXTERNALLY
    toString() {
        return this.tileData.toString();
    }

    // Utils: No OOB checks
    convToFlat(pos) {
        return this.tileData.convToFlat(pos);
    }
    convToSquare(z) {
        return this.tileData.convToSquare(z);
    }
    convRelToArrPos(pos) {
        return this.tileData.convRelToArrPos(pos);
    }
    convArrToRelPos(pos) {
        return this.tileData.convArrToRelPos(pos);
    }
    
    // Bulk: Range functions do not have OOB checks, Neighborhood handles OOB automatically.
    getRangeData(tlArrayPos,brArrayPos) {
        return this.tileData.getRangeData(tlArrayPos,brArrayPos);
    }
    getRangeNeighborhoodData(arrayPos,radius) {
        return this.tileData.getRangeNeighborhoodData(arrayPos,radius);
    }
    getRangeGrid(tlArrayPos,brArrayPos) {
        return this.tileData.getRangeGrid(tlArrayPos,brArrayPos);
    }
    getRangeNeighborhoodGrid(arrayPos,radius) {
        return this.tileData.getRangeNeighborhoodGrid(arrayPos,radius);
    }

    // Access: OOB warning messages in console. Search for lines with "Grid#" (infoStr() returns)
    getArrPos(pos) {
        return this.tileData.getArrPos(pos);
    }
    setArrPos(pos,obj) {
        return this.tileData.setArrPos(pos,obj);
    }
    get(relPos) {
        return this.tileData.get(relPos);
    }
    set(relPos,obj) {
        return this.tileData.set(relPos,obj);
    }

    // Debug 
    print() {
        this.tileData.print();
    }
    infoStr() {
        return this.tileData.infoStr();
    }

    // Info of struct, modification restricted.
    getSize() {
        return this.tileData.getSize();
    }
    getSpanRange() {
        return this.tileData.getSpanRange();
    }
    getObjPos() {
        return this.tileData.getObjPos();
    }
    getGridId() {
        return this.tileData.getGridId();
    }
}


// function stall(time) {
//     for (let i = 0; i < time*1000; ++i) {
//         console.log(i)
//     }
// }


function TEST_CHUNK() {
    console.log("=============== TEST_CHUNK RUN:")
    // terrainPreloader()

    let chunk = new Chunk(NONE,[0,0],8); // IGNORING 'official' chunk position, coordinate system defined
    let renderConverter = new camRenderConverter([0,0],[windowWidth,windowHeight])    
    // renderConverter.forceTileUpdate()

    console.log("Default chunk layout:")
    chunk.print()

    console.log("CamRenderConverter state: + [0,0],[1,1]")
    console.log(renderConverter.getViewSpan())
    console.log(renderConverter.convPosToCanvas([0,0]))
    console.log(renderConverter.convPosToCanvas([1,1]))
    
    chunk.render(renderConverter) // Working...

    if (chunk.get([4,4]).material != 'grass') {
        console.log("Default state of chunk not as expected.")
        return 0
    }
    // return 0
    // stall(1000)

    console.log("Perlin:")
    chunk.applyGenerationMode('perlin',[0,0],[1,1]) // Working...
    chunk.render(renderConverter)
    chunk.print()

    let materialPrev = 'grass'
    for (let i = 0; i < chunk.getSize()[0]*chunk.getSize()[1]; ++i) {
        if (materialPrev != chunk.get(chunk.tileData.convToSquare(i)).material) {
            materialPrev = chunk.get(chunk.tileData.convToSquare(i)).material;
            break;
        }
        // materialPrev = chunk.get(chunk.tileData.convToSquare(i)).material;
    }
    if (materialPrev == 'grass') {
        console.log("Perlin noise POTENTIALLY failed to generate. See print logs.")
    }
    // return 0

    // stall(1000)

    console.log("Columns:columns")
    chunk.applyGenerationMode('columns',[0,0],[1,1]) // Working...
    chunk.print()
    chunk.render(renderConverter)
    // return 0

    if (chunk.get([4,4]).material == chunk.get([5,4]) | chunk.get([4,4]).material != chunk.get([4,5]).material) {
        console.log("Column generation failed to generate.")
        return 0
    }     

    // stall(1000)

    console.log("Checkerboard:")
    chunk.applyGenerationMode('checkerboard',[0,0],[1,1]) // Working...
    chunk.print()
    chunk.render(renderConverter)
    // return 0

    if (chunk.get([4,4]).material == chunk.get([5,4]).material | chunk.get([4,4]).material == chunk.get([4,5]).material | chunk.get([4,4]).material != chunk.get([5,5]).material) {
        console.log("Checkerboard generation failed.")
        return 0
    }

    // stall(1000)

    console.log("Flat:")
    chunk.applyGenerationMode('flat',[0,0],[1,1]) // Working...
    chunk.print()
    chunk.render(renderConverter)
    // return 0

    if (chunk.get([4,4]).material != chunk.get([4,5]).material) {
        console.log("Flat generation failed.")
        return 0
    }

    // stall(1000)

    console.log("Blank:")
    chunk.applyGenerationMode('blank',[0,0],[1,1]) // Working...
    chunk.print()
    chunk.render(renderConverter)
    // return 0

    if (chunk.get([4,4]).material != 'dirt' | chunk.get([4,4]).material != chunk.get([4,5]).material) {
        console.log("Blank generation failed.")
        return 0
    }

    // stall(1000)

    console.log("Flat+Dif Material:moss")
    chunk.applyFlatTerrain('moss')
    chunk.print()
    chunk.render(renderConverter)
    // return 0

    if (chunk.get([4,4]).material != 'moss' | chunk.get([4,4]).material != chunk.get([4,5]).material) {
        console.log("Flat generation failed. (Moss)")
        return 0
    }

    // stall(1000)

    console.log("Flat+Dif Material:stone")
    chunk.applyFlatTerrain('stone')
    chunk.print()
    chunk.render(renderConverter)
    // return 0

    if (chunk.get([4,4]).material != 'stone' | chunk.get([4,4]).material != chunk.get([4,5]).material) {
        console.log("Flat generation failed. (Stone)")
        return 0
    }

    // stall(1000)

    chunk.clear()
    chunk.render(renderConverter)

    if (chunk.get([4,4]).material != 'grass' | chunk.get([4,4]).material != chunk.get([4,5]).material) {
        console.log("Clearing failed. (NOTE: THIS ENSURES PERLIN TEST NOT FAILING UNNECESSARILY)")
        return 0
    }

    console.log("TEST_CHUNK END ===============")
    return 1
}