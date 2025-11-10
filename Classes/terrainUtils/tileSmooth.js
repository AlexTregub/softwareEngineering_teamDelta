///// WILL CONTAIN ALL RESOURCES FOR HOLDING + HANDLING TILE MODIFIERS.
///// INEFFICIENT COMPARED TO A PROPER TILEMAP. TEMPORARY.
let DIRT_B
let DIRT_BL
let DIRT_BR
let DIRT_L
let DIRT_R
let DIRT_T
let DIRT_TL
let DIRT_TR
let GRASS_B
let GRASS_BL
let GRASS_BR
let GRASS_L
let GRASS_R
let GRASS_T
let GRASS_TL
let GRASS_TR
let MOSS_B
let MOSS_BL
let MOSS_BR
let MOSS_L
let MOSS_R
let MOSS_T
let MOSS_TL
let MOSS_TR
let STONE_B
let STONE_BL
let STONE_BR
let STONE_L
let STONE_R
let STONE_T
let STONE_TL
let STONE_TR
let WATER_B
let WATER_BL
let WATER_BR
let WATER_L
let WATER_R
let WATER_T
let WATER_TL
let WATER_TR

function smoothingPreload() {
    DIRT_B=loadImage('Images/tileEdges_16x16/dirt/dirt_b.png')
    DIRT_BL=loadImage('Images/tileEdges_16x16/dirt/dirt_bl.png')
    DIRT_BR=loadImage('Images/tileEdges_16x16/dirt/dirt_br.png')
    DIRT_L=loadImage('Images/tileEdges_16x16/dirt/dirt_l.png')
    DIRT_R=loadImage('Images/tileEdges_16x16/dirt/dirt_r.png')
    DIRT_T=loadImage('Images/tileEdges_16x16/dirt/dirt_t.png')
    DIRT_TL=loadImage('Images/tileEdges_16x16/dirt/dirt_tl.png')
    DIRT_TR=loadImage('Images/tileEdges_16x16/dirt/dirt_tr.png')
    // console.log("LOADED DIRT")

    GRASS_B=loadImage('Images/tileEdges_16x16/grass/grass_b.png')
    GRASS_BL=loadImage('Images/tileEdges_16x16/grass/grass_bl.png')
    GRASS_BR=loadImage('Images/tileEdges_16x16/grass/grass_br.png')
    GRASS_L=loadImage('Images/tileEdges_16x16/grass/grass_l.png')
    GRASS_R=loadImage('Images/tileEdges_16x16/grass/grass_r.png')
    GRASS_T=loadImage('Images/tileEdges_16x16/grass/grass_t.png')
    GRASS_TL=loadImage('Images/tileEdges_16x16/grass/grass_tl.png')
    GRASS_TR=loadImage('Images/tileEdges_16x16/grass/grass_tr.png')

    MOSS_B=loadImage('Images/tileEdges_16x16/moss/moss_b.png')
    MOSS_BL=loadImage('Images/tileEdges_16x16/moss/moss_bl.png')
    MOSS_BR=loadImage('Images/tileEdges_16x16/moss/moss_br.png')
    MOSS_L=loadImage('Images/tileEdges_16x16/moss/moss_l.png')
    MOSS_R=loadImage('Images/tileEdges_16x16/moss/moss_r.png')
    MOSS_T=loadImage('Images/tileEdges_16x16/moss/moss_t.png')
    MOSS_TL=loadImage('Images/tileEdges_16x16/moss/moss_tl.png')
    MOSS_TR=loadImage('Images/tileEdges_16x16/moss/moss_tr.png')

    STONE_B=loadImage('Images/tileEdges_16x16/stone/stone_b.png')
    STONE_BL=loadImage('Images/tileEdges_16x16/stone/stone_bl.png')
    STONE_BR=loadImage('Images/tileEdges_16x16/stone/stone_br.png')
    STONE_L=loadImage('Images/tileEdges_16x16/stone/stone_l.png')
    STONE_R=loadImage('Images/tileEdges_16x16/stone/stone_r.png')
    STONE_T=loadImage('Images/tileEdges_16x16/stone/stone_t.png')
    STONE_TL=loadImage('Images/tileEdges_16x16/stone/stone_tl.png')
    STONE_TR=loadImage('Images/tileEdges_16x16/stone/stone_tr.png')

    WATER_B=loadImage('Images/tileEdges_16x16/water/water_b.png')
    WATER_BL=loadImage('Images/tileEdges_16x16/water/water_bl.png')
    WATER_BR=loadImage('Images/tileEdges_16x16/water/water_br.png')
    WATER_L=loadImage('Images/tileEdges_16x16/water/water_l.png')
    WATER_R=loadImage('Images/tileEdges_16x16/water/water_r.png')
    WATER_T=loadImage('Images/tileEdges_16x16/water/water_t.png')
    WATER_TL=loadImage('Images/tileEdges_16x16/water/water_tl.png')
    WATER_TR=loadImage('Images/tileEdges_16x16/water/water_tr.png')
    // console.log("LOADED SMOOTHING")
}

const MATERIAL_OVERRIDE_HANDLING = { // Higher weight == override. Not included tiles assumed -1
    "dirt" : 12,
    "grass" : 25,
    "moss" : 37,
    "stone" : 6, 
    "water" : 50
    // Note, sand should override stone,grass,moss but not water. Sand almost never near dirt, but allowed to override as is 'runnier'
}

class frillsChunk {
    constructor(chunkPos,spanTLPos,size=CHUNK_SIZE,tileSize=TILE_SIZE) {
        this._chunkPos = chunkPos;
        this._spanTLPos = spanTLPos;
        this._size = size;
        this._tileSize = tileSize;
        
        this.tileData = new Grid(this._size,this._size,this._spanTLPos,this._chunkPos); // Public, can access through chunk.tileData.*

        // Prepare chunk
        let len = this._size*this._size;
        for (let i = 0; i < len; ++i) {
            this.tileData.rawArray[i] = [] // Will hold a list of 'FRILLS' per Tile. Will need to render all...
        }
    }

    updateFrills(externalTerrain=g_activeMap) {
        let len = this._size*this._size;

        for (let i = 0; i < len; ++i) { // Updating local frill arrays...
            // let arrPos = this.convToSquare(i)
            let targetPos = this.convArrToRelPos(this.convToSquare(i)) // Position being 'frilled'

            // Get current stats:
            let targetMaterial = externalTerrain.get(targetPos).getMaterial()
            targetMaterial = targetMaterial.split('_',1)[0] // drop terrain type modifier.
            let targetOverlap = MATERIAL_OVERRIDE_HANDLING[targetMaterial] ? MATERIAL_OVERRIDE_HANDLING[targetMaterial] : -1

            // CALCULATE + ADD OVERWRITES: (Moore neighborhood)
            // WILL ONLY CONSIDER OVERWRITES TO EXTERNAL, NOT TO TARGET. (sim to diffusion)
            if (targetOverlap != -1) { // Assuming we need to calculate...
                // TL
                let tempPos = [targetPos[0]-1,targetPos[1]-1]
                let boundPos = [
                    (tempPos[0] < this.getSpanRange()[0][0]) ? this.getSpanRange()[0][0] : tempPos[0],
                    (tempPos[1] < this.getSpanRange()[0][1]) ? this.getSpanRange()[0][1] : tempPos[1],
                ]
                boundPos = [
                    (boundPos[0] >= this.getSpanRange()[1][0]) ? this.getSpanRange()[1][0]-1 : boundPos[0],
                    (boundPos[1] >= this.getSpanRange()[1][1]) ? this.getSpanRange()[1][1]-1 : boundPos[1],
                ]
                let tempMat = externalTerrain.get(boundPos).getMaterial()
                tempMat = tempMat.split('_',1)[0]
                let tempOverlap =  MATERIAL_OVERRIDE_HANDLING[tempMat] ? MATERIAL_OVERRIDE_HANDLING[tempMat] : -1

                if (tempOverlap < targetOverlap) {
                    let temp
                    switch(targetMaterial) {
                        case 'dirt':
                            temp = new pseudoTile(tempPos[0]-0.5,tempPos[1]-0.5,this._tileSize,DIRT_TL)
                            break
                        case 'grass':
                            temp = new pseudoTile(tempPos[0]-0.5,tempPos[1]-0.5,this._tileSize,GRASS_TL)
                            break
                        case 'moss':
                            temp = new pseudoTile(tempPos[0]-0.5,tempPos[1]-0.5,this._tileSize,MOSS_TL)
                            break
                        case 'stone':
                            temp = new pseudoTile(tempPos[0]-0.5,tempPos[1]-0.5,this._tileSize,STONE_TL)
                            break
                        case 'water':
                            temp = new pseudoTile(tempPos[0]-0.5,tempPos[1]-0.5,this._tileSize,WATER_TL)
                            break
                        default:
                            temp = NONE
                    }
                    
                    this.tileData.rawArray[i].push(temp)
                }

                // T
                tempPos = [targetPos[0],targetPos[1]-1]
                boundPos = [
                    (tempPos[0] < this.getSpanRange()[0][0]) ? this.getSpanRange()[0][0] : tempPos[0],
                    (tempPos[1] < this.getSpanRange()[0][1]) ? this.getSpanRange()[0][1] : tempPos[1],
                ]
                boundPos = [
                    (boundPos[0] >= this.getSpanRange()[1][0]) ? this.getSpanRange()[1][0]-1 : boundPos[0],
                    (boundPos[1] >= this.getSpanRange()[1][1]) ? this.getSpanRange()[1][1]-1 : boundPos[1],
                ]
                tempMat = externalTerrain.get(boundPos).getMaterial()
                tempMat = tempMat.split('_',1)[0]
                tempOverlap =  MATERIAL_OVERRIDE_HANDLING[tempMat] ? MATERIAL_OVERRIDE_HANDLING[tempMat] : -1

                if (tempOverlap < targetOverlap) {
                    let temp
                    switch(targetMaterial) {
                        case 'dirt':
                            temp = new pseudoTile(tempPos[0]-0.5,tempPos[1]-0.5,this._tileSize,DIRT_T)
                            break
                        case 'grass':
                            temp = new pseudoTile(tempPos[0]-0.5,tempPos[1]-0.5,this._tileSize,GRASS_T)
                            break
                        case 'moss':
                            temp = new pseudoTile(tempPos[0]-0.5,tempPos[1]-0.5,this._tileSize,MOSS_T)
                            break
                        case 'stone':
                            temp = new pseudoTile(tempPos[0]-0.5,tempPos[1]-0.5,this._tileSize,STONE_T)
                            break
                        case 'water':
                            temp = new pseudoTile(tempPos[0]-0.5,tempPos[1]-0.5,this._tileSize,WATER_T)
                            break
                        default:
                            temp = NONE
                    }
                    
                    this.tileData.rawArray[i].push(temp)
                }

                // TR
                tempPos = [targetPos[0]+1,targetPos[1]-1]
                boundPos = [
                    (tempPos[0] < this.getSpanRange()[0][0]) ? this.getSpanRange()[0][0] : tempPos[0],
                    (tempPos[1] < this.getSpanRange()[0][1]) ? this.getSpanRange()[0][1] : tempPos[1],
                ]
                boundPos = [
                    (boundPos[0] >= this.getSpanRange()[1][0]) ? this.getSpanRange()[1][0]-1 : boundPos[0],
                    (boundPos[1] >= this.getSpanRange()[1][1]) ? this.getSpanRange()[1][1]-1 : boundPos[1],
                ]
                tempMat = externalTerrain.get(boundPos).getMaterial()
                tempMat = tempMat.split('_',1)[0]
                tempOverlap =  MATERIAL_OVERRIDE_HANDLING[tempMat] ? MATERIAL_OVERRIDE_HANDLING[tempMat] : -1

                if (tempOverlap < targetOverlap) {
                    let temp
                    switch(targetMaterial) {
                        case 'dirt':
                            temp = new pseudoTile(tempPos[0]-0.5,tempPos[1]-0.5,this._tileSize,DIRT_TR)
                            break
                        case 'grass':
                            temp = new pseudoTile(tempPos[0]-0.5,tempPos[1]-0.5,this._tileSize,GRASS_TR)
                            break
                        case 'moss':
                            temp = new pseudoTile(tempPos[0]-0.5,tempPos[1]-0.5,this._tileSize,MOSS_TR)
                            break
                        case 'stone':
                            temp = new pseudoTile(tempPos[0]-0.5,tempPos[1]-0.5,this._tileSize,STONE_TR)
                            break
                        case 'water':
                            temp = new pseudoTile(tempPos[0]-0.5,tempPos[1]-0.5,this._tileSize,WATER_TR)
                            break
                        default:
                            temp = NONE
                    }
                    
                    this.tileData.rawArray[i].push(temp)
                }

                // L
                tempPos = [targetPos[0]-1,targetPos[1]]
                boundPos = [
                    (tempPos[0] < this.getSpanRange()[0][0]) ? this.getSpanRange()[0][0] : tempPos[0],
                    (tempPos[1] < this.getSpanRange()[0][1]) ? this.getSpanRange()[0][1] : tempPos[1],
                ]
                boundPos = [
                    (boundPos[0] >= this.getSpanRange()[1][0]) ? this.getSpanRange()[1][0]-1 : boundPos[0],
                    (boundPos[1] >= this.getSpanRange()[1][1]) ? this.getSpanRange()[1][1]-1 : boundPos[1],
                ]
                tempMat = externalTerrain.get(boundPos).getMaterial()
                tempMat = tempMat.split('_',1)[0]
                tempOverlap =  MATERIAL_OVERRIDE_HANDLING[tempMat] ? MATERIAL_OVERRIDE_HANDLING[tempMat] : -1

                if (tempOverlap < targetOverlap) {
                    let temp
                    switch(targetMaterial) {
                        case 'dirt':
                            temp = new pseudoTile(tempPos[0]-0.5,tempPos[1]-0.5,this._tileSize,DIRT_L)
                            break
                        case 'grass':
                            temp = new pseudoTile(tempPos[0]-0.5,tempPos[1]-0.5,this._tileSize,GRASS_L)
                            break
                        case 'moss':
                            temp = new pseudoTile(tempPos[0]-0.5,tempPos[1]-0.5,this._tileSize,MOSS_L)
                            break
                        case 'stone':
                            temp = new pseudoTile(tempPos[0]-0.5,tempPos[1]-0.5,this._tileSize,STONE_L)
                            break
                        case 'water':
                            temp = new pseudoTile(tempPos[0]-0.5,tempPos[1]-0.5,this._tileSize,WATER_L)
                            break
                        default:
                            temp = NONE
                    }
                    
                    this.tileData.rawArray[i].push(temp)
                }

                // R
                tempPos = [targetPos[0]+1,targetPos[1]]
                boundPos = [
                    (tempPos[0] < this.getSpanRange()[0][0]) ? this.getSpanRange()[0][0] : tempPos[0],
                    (tempPos[1] < this.getSpanRange()[0][1]) ? this.getSpanRange()[0][1] : tempPos[1],
                ]
                boundPos = [
                    (boundPos[0] >= this.getSpanRange()[1][0]) ? this.getSpanRange()[1][0]-1 : boundPos[0],
                    (boundPos[1] >= this.getSpanRange()[1][1]) ? this.getSpanRange()[1][1]-1 : boundPos[1],
                ]
                tempMat = externalTerrain.get(boundPos).getMaterial()
                tempMat = tempMat.split('_',1)[0]
                tempOverlap =  MATERIAL_OVERRIDE_HANDLING[tempMat] ? MATERIAL_OVERRIDE_HANDLING[tempMat] : -1

                if (tempOverlap < targetOverlap) {
                    let temp
                    switch(targetMaterial) {
                        case 'dirt':
                            temp = new pseudoTile(tempPos[0]-0.5,tempPos[1]-0.5,this._tileSize,DIRT_R)
                            break
                        case 'grass':
                            temp = new pseudoTile(tempPos[0]-0.5,tempPos[1]-0.5,this._tileSize,GRASS_R)
                            break
                        case 'moss':
                            temp = new pseudoTile(tempPos[0]-0.5,tempPos[1]-0.5,this._tileSize,MOSS_R)
                            break
                        case 'stone':
                            temp = new pseudoTile(tempPos[0]-0.5,tempPos[1]-0.5,this._tileSize,STONE_R)
                            break
                        case 'water':
                            temp = new pseudoTile(tempPos[0]-0.5,tempPos[1]-0.5,this._tileSize,WATER_R)
                            break
                        default:
                            temp = NONE
                    }
                    
                    this.tileData.rawArray[i].push(temp)
                }

                // BL
                tempPos = [targetPos[0]-1,targetPos[1]+1]
                boundPos = [
                    (tempPos[0] < this.getSpanRange()[0][0]) ? this.getSpanRange()[0][0] : tempPos[0],
                    (tempPos[1] < this.getSpanRange()[0][1]) ? this.getSpanRange()[0][1] : tempPos[1],
                ]
                boundPos = [
                    (boundPos[0] >= this.getSpanRange()[1][0]) ? this.getSpanRange()[1][0]-1 : boundPos[0],
                    (boundPos[1] >= this.getSpanRange()[1][1]) ? this.getSpanRange()[1][1]-1 : boundPos[1],
                ]
                tempMat = externalTerrain.get(boundPos).getMaterial()
                tempMat = tempMat.split('_',1)[0]
                tempOverlap =  MATERIAL_OVERRIDE_HANDLING[tempMat] ? MATERIAL_OVERRIDE_HANDLING[tempMat] : -1

                if (tempOverlap < targetOverlap) {
                    let temp
                    switch(targetMaterial) {
                        case 'dirt':
                            temp = new pseudoTile(tempPos[0]-0.5,tempPos[1]-0.5,this._tileSize,DIRT_BL)
                            break
                        case 'grass':
                            temp = new pseudoTile(tempPos[0]-0.5,tempPos[1]-0.5,this._tileSize,GRASS_BL)
                            break
                        case 'moss':
                            temp = new pseudoTile(tempPos[0]-0.5,tempPos[1]-0.5,this._tileSize,MOSS_BL)
                            break
                        case 'stone':
                            temp = new pseudoTile(tempPos[0]-0.5,tempPos[1]-0.5,this._tileSize,STONE_BL)
                            break
                        case 'water':
                            temp = new pseudoTile(tempPos[0]-0.5,tempPos[1]-0.5,this._tileSize,WATER_BL)
                            break
                        default:
                            temp = NONE
                    }
                    
                    this.tileData.rawArray[i].push(temp)
                }

                // B
                tempPos = [targetPos[0],targetPos[1]+1]
                boundPos = [
                    (tempPos[0] < this.getSpanRange()[0][0]) ? this.getSpanRange()[0][0] : tempPos[0],
                    (tempPos[1] < this.getSpanRange()[0][1]) ? this.getSpanRange()[0][1] : tempPos[1],
                ]
                boundPos = [
                    (boundPos[0] >= this.getSpanRange()[1][0]) ? this.getSpanRange()[1][0]-1 : boundPos[0],
                    (boundPos[1] >= this.getSpanRange()[1][1]) ? this.getSpanRange()[1][1]-1 : boundPos[1],
                ]
                tempMat = externalTerrain.get(boundPos).getMaterial()
                tempMat = tempMat.split('_',1)[0]
                tempOverlap =  MATERIAL_OVERRIDE_HANDLING[tempMat] ? MATERIAL_OVERRIDE_HANDLING[tempMat] : -1

                if (tempOverlap < targetOverlap) {
                    let temp
                    switch(targetMaterial) {
                        case 'dirt':
                            temp = new pseudoTile(tempPos[0]-0.5,tempPos[1]-0.5,this._tileSize,DIRT_B)
                            break
                        case 'grass':
                            temp = new pseudoTile(tempPos[0]-0.5,tempPos[1]-0.5,this._tileSize,GRASS_B)
                            break
                        case 'moss':
                            temp = new pseudoTile(tempPos[0]-0.5,tempPos[1]-0.5,this._tileSize,MOSS_B)
                            break
                        case 'stone':
                            temp = new pseudoTile(tempPos[0]-0.5,tempPos[1]-0.5,this._tileSize,STONE_B)
                            break
                        case 'water':
                            temp = new pseudoTile(tempPos[0]-0.5,tempPos[1]-0.5,this._tileSize,WATER_B)
                            break
                        default:
                            temp = NONE
                    }
                    
                    this.tileData.rawArray[i].push(temp)
                }

                // BR
                tempPos = [targetPos[0]+1,targetPos[1]+1]
                boundPos = [
                    (tempPos[0] < this.getSpanRange()[0][0]) ? this.getSpanRange()[0][0] : tempPos[0],
                    (tempPos[1] < this.getSpanRange()[0][1]) ? this.getSpanRange()[0][1] : tempPos[1],
                ]
                boundPos = [
                    (boundPos[0] >= this.getSpanRange()[1][0]) ? this.getSpanRange()[1][0]-1 : boundPos[0],
                    (boundPos[1] >= this.getSpanRange()[1][1]) ? this.getSpanRange()[1][1]-1 : boundPos[1],
                ]
                tempMat = externalTerrain.get(boundPos).getMaterial()
                tempMat = tempMat.split('_',1)[0]
                tempOverlap =  MATERIAL_OVERRIDE_HANDLING[tempMat] ? MATERIAL_OVERRIDE_HANDLING[tempMat] : -1

                if (tempOverlap < targetOverlap) {
                    let temp
                    switch(targetMaterial) {
                        case 'dirt':
                            temp = new pseudoTile(tempPos[0]-0.5,tempPos[1]-0.5,this._tileSize,DIRT_BR)
                            break
                        case 'grass':
                            temp = new pseudoTile(tempPos[0]-0.5,tempPos[1]-0.5,this._tileSize,GRASS_BR)
                            break
                        case 'moss':
                            temp = new pseudoTile(tempPos[0]-0.5,tempPos[1]-0.5,this._tileSize,MOSS_BR)
                            break
                        case 'stone':
                            temp = new pseudoTile(tempPos[0]-0.5,tempPos[1]-0.5,this._tileSize,STONE_BR)
                            break
                        case 'water':
                            temp = new pseudoTile(tempPos[0]-0.5,tempPos[1]-0.5,this._tileSize,WATER_BR)
                            break
                        default:
                            temp = NONE
                    }
                    
                    this.tileData.rawArray[i].push(temp)
                }
            }
        }
    }

    render(coordSys) { // Will render calculated frills
        let len = this.tileData.getSize()[0]*this.tileData.getSize()[1];
        
        for (let i = 0; i < len; ++i) {
            for (let j = 0; j < this.tileData.rawArray[i].length; ++j) {
                this.tileData.rawArray[i][j].render(coordSys)
            }
        }
    }

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

class pseudoTile {
    constructor(renderX,renderY,tileSize,texture) {
        // Internal coords
        this._x = renderX;
        this._y = renderY;

        this._squareSize = tileSize;

        this._texture = texture
        
        // Caching position calc
        this._coordSysUpdateId = -1; // Used for render conversion optimizations
        this._coordSysPos = NONE;
    }

    render(coordSys) {
        if (this._texture == NONE) { return }
        if (this._coordSysUpdateId != coordSys.getUpdateId() || this._coordSysPos == NONE) {
            this._coordSysPos = coordSys.convPosToCanvas([this._x,this._y]);
        }

        noSmooth()
        image(this._texture,this._coordSysPos[0],this._coordSysPos[1],this._squareSize,this._squareSize)
        smooth()
    }
}