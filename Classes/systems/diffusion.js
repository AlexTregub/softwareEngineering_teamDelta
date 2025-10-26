///// Diffusion grid (pain)
// Accessing things via private is a bad idea, this will bite me in the ass someday

class PheromoneGrid {
    constructor(map=g_map2) {
        this._selLeft = true; // Two internal grids: Left & Right

        this._mapTileSize = map._tileSpanRange;
        this._mapTL = map._tileSpan[0];

        // Pheromone 'REGISTRIES' - Stores cells to update...
        // DO NOT DELETE VALS, SET TO NONE.
        // this._rightFlat = [];
        // this._leftFlat = [];
        this._rightSet = new Set(); // Cannot manually specify hashmapPos...
        this._leftSet = new Set();

        // Pheromone GRIDS 
        this._right = NONE;
        this._left = NONE;
        this.initSelGrid();         
        this.initSelGrid(!this._selLeft); // Both grids should be initialized
    }

    //// Utils: 
    initSelGrid(selLeft = this._selLeft) { // By default, initializes currently selected
        if (selLeft) { // Op on left
            this._left = new Grid(this._mapTileSize[0],this._mapTileSize[1],this._mapTL);

            for (let i = 0; i < this._left._sizeArr; ++i) {
                this._left.rawArray[i] = []; // Empty arrs for pheromones...
            }
            return;
        }
        // ...
        this._right = new Grid(this._mapTileSize[0],this._mapTileSize[1],this._mapTL);
        
        for (let i = 0; i < this._right._sizeArr; ++i) {
            this._right.rawArray[i] = []; // Empty arrs
        }
    }

    syncGrid(selLeft = this._selLeft) { // Sync currently selected grid across.
        if (selLeft) { // Left->Right
            // Clear
            this._rightSet.clear();
            this.initSelGrid(!selLeft);

            // Copy
            this._rightSet = this._leftSet;
            this._right = this._left;
        }

        // Clear
        this._leftSet.clear();
        this.initSelGrid(!selLeft);

        // Copy
        this._leftSet = this._rightSet;
        this._left = this._right;
    }

    //// Access: (defaults on selected grid) BASED ON ARRAY NOT ON Pos class.
    get(posArr,selLeft=this._selLeft) { // Gets raw pheromone array at position
        if (selLeft) {
            // console.log(this._left.get(posArr));
            return this._left.get(posArr); 
        }

        return this._right.get(posArr);
    }

    push(posArr,pheromone,selLeft=this._selLeft) { // Merges ONE pheromone into cell
        // ENSURE MERGE LOGIC IS THE SAME IN BOTH...
        if (selLeft) {
            if (this._leftSet.has(posArr)) { // If exists, merge...
                // Key exists...
                let gridAccessPos = this._left.convToFlat(this._left.convPosToArr(posArr));
                let length = this._left.rawArray[gridAccessPos].length;

                for (let i = 0; i < length; ++i) { // Check for matching type, merge if needed and early exit.
                    if (pheromone.type == this._left.rawArray[gridAccessPos][i].type) {
                        // CURRENT MERGE LOGIC, LIKELY CHANGED IN FUTURE.
                        this._left.rawArray[gridAccessPos][i].strength = 
                            Math.max(pheromone.strength,this._left.rawArray[gridAccessPos][i].strength);
                        this._left.rawArray[gridAccessPos][i].initial = 
                            Math.max(pheromone.initial,this._left.rawArray[gridAccessPos][i].initial);

                        return;
                    }
                }
                
                // Type not exist in cell
                this._left.rawArray[gridAccessPos].push(pheromone);
            } else { // Easy set...
                this._left.set(posArr,[pheromone]);
                this._leftSet.add(new hashmapPosition(posArr[0],posArr[1]));
            }

            return;
        }

        // selRight
        if (this._rightSet.has(posArr)) { // If exists, merge...
            // Key exists...
            let gridAccessPos = this._right.convToFlat(this._right.convPosToArr(posArr));
            let length = this._right.rawArray[gridAccessPos].length;

            for (let i = 0; i < length; ++i) { // Check for matching type, merge if needed and early exit.
                if (pheromone.type == this._right.rawArray[gridAccessPos][i].type) {
                    // CURRENT MERGE LOGIC, LIKELY CHANGED IN FUTURE.
                    this._right.rawArray[gridAccessPos][i].strength = 
                        Math.max(pheromone.strength,this._right.rawArray[gridAccessPos][i].strength);
                    this._right.rawArray[gridAccessPos][i].initial = 
                        Math.max(pheromone.initial,this._right.rawArray[gridAccessPos][i].initial);

                    return;
                }
            }
            
            // Type not exist in cell, add
            this._right.rawArray[gridAccessPos].push(pheromone);
        } else { // Easy set...
            this._right.set(posArr,[pheromone]);
            this._rightSet.add(new hashmapPosition(posArr[0],posArr[1]));
        }
    }

    set(posArr,pheromoneArray,selLeft=this._selLeft) { // ...,  selGet=this._selLeft,selPut=this._selLeft) { // OVERWRITE pheromone array
        if (selLeft) {
            this._left.set(posArr,pheromoneArray); // Grid Update
            // console.log(pheromoneArray);
            // console.log(this._left.get(posArr));
            
            if (pheromoneArray.length == 0) { // If setting to empty...
                this._leftSet.delete(new hashmapPosition(posArr[0],posArr[1]));
            } else {
                this._leftSet.add(new hashmapPosition(posArr[0],posArr[1]));
                // console.log(this._leftSet)
            }

            // console.log(pheromoneArray);
            // console.log(this._left.get(posArr));

            // console.log(this._leftSet);
            return;
        }
        this._right.set(posArr,pheromoneArray); // Grid Update
            
        if (pheromoneArray.length == 0) { // If setting to empty...
            this._rightSet.delete(new hashmapPosition(posArr[0],posArr[1]));
        } else {
            this._rightSet.add(new hashmapPosition(posArr[0],posArr[1]));
        }

        return;
    }

    wash(posArr,selLeft=this._selLeft) { // Clear pheromones from cell.
        this.set(posArr,[],selLeft);
    }

    //// Diffusion + Evaporation:
    diffuse(selLeft=this._selLeft) { // Will diffuse grid in selLeft -> !selleft. DOES NOT UPDATE _selLeft
        if (selLeft) { // Left grid -> right grid
            // Clear right grid
            this._rightSet.clear();
            this.initSelGrid(!selLeft);

            // Update cells - Will need to first get 1-step neighbors, then update ONLY those cells. Operating on _leftSet
            let initTargets = new Set(this._leftSet);
            // get vonNeumann-neighbors, ensure in-bounds (performed after: at worst sizeOfGrid(n+1)~n^2+2n+1 checks, sizeOfGrid(n+1)-sizeOfGrid(n) removes) VS: (performed during: 4*sizeOfGrid(n)~4n^2 checks, ...)
            for (let pos of this._leftSet) { 
                // console.log(pos.x,pos.y);
                // initTargets.add(new hashmapPosition(pos.x,pos.y)); // Should also be needed...

                initTargets.add(new hashmapPosition(pos.x,pos.y+1));
                initTargets.add(new hashmapPosition(pos.x,pos.y-1));
                initTargets.add(new hashmapPosition(pos.x-1,pos.y));
                initTargets.add(new hashmapPosition(pos.x+1,pos.y));
            }

            // Drop OOB - increase mem cost temporarily to potentially save on compute
            let rightSet = new Set();
            for (let pos of initTargets) {
                if (pos.x >= this._left._spanTopLeft[0] && pos.x < this._left._spanBotRight[0]
                    && pos.y >= this._left._spanTopLeft[1] && pos.y < this._left._spanBotRight[1]
                ) {
                    rightSet.add(pos);
                }
            }
            // console.log("RIGHTSET:",rightSet);

            // Diffusion (of targeted cells) - needs to handle neighbor merge conflicts, and store to _right.
            // this._rightSet = targets; // Given at least 1 neighbor has value if in targets, diffusion will produce a value in this cell.
            for (let pos of rightSet) {
                // Collect all pheromones. Store as list of pheromonesTypeArrays of pheromone arrays.
                let target = this.get([pos.x,pos.y],selLeft);
                let vnNeighborhood = [
                    target, // Target
                    this.get([pos.x,pos.y+1],selLeft), // Up,down,left,right
                    this.get([pos.x,pos.y-1],selLeft),
                    this.get([pos.x-1,pos.y],selLeft),
                    this.get([pos.x+1,pos.y],selLeft)
                ];

                let pherTypeArrs = []; // Stores un-merged, typed pheromones
                let pherTypes = new Map(); // Will store [type,index]
                for (let i = 0; i < vnNeighborhood.length; ++i) { // Pher array access
                    for (let j = 0; j < vnNeighborhood[i].length; ++j) { // Pher. access
                        if (!pherTypes.has(vnNeighborhood[i][j].type)) {
                            pherTypes.set(vnNeighborhood[i][j].type,pherTypeArrs.length);
                            pherTypeArrs.push([vnNeighborhood[i][j]]); // Push arr of 1 pher
                        } else {
                            pherTypeArrs[pherTypes.get(vnNeighborhood[i][j].type)].push(vnNeighborhood[i][j]); // Push pheromone to typeArrs at typePos
                        }
                    }
                }

                // Merge for target rate, stored initial stregnth calc - average value for stregnth
                // VERIFY WHETHER CORRECT DIFFUSION EQUATION WILL BE USED. POTENTIALLY REDUNDANT TARGET VALUE AVERAGED.
                let pherMerged = [];
                for (let i = 0; i < pherTypeArrs.length; ++i) {
                    let temp = new Pheromone(pherTypeArrs[i][0].type,0,0,0,0); // (type,strength,initial,rate,evaporate)
                    for (let j = 0; j < pherTypeArrs[i].length; ++j) {
                        temp.strength += pherTypeArrs[i][j].strength; // AVERAGED...
                        temp.initial = Math.max(temp.initial,pherTypeArrs[i][j].initial);
                        temp.rate += pherTypeArrs[i][j].rate; // AVERAGED
                        temp.evaporate += pherTypeArrs[i][j].evaporate; // AVERAGED
                    }

                    temp.strength /= pherTypeArrs[i].length;
                    temp.rate /= pherTypeArrs[i].length;
                    temp.evaporate /= pherTypeArrs[i].length;

                    pherMerged.push(temp);
                }

                // Diffusion with target values
                let diffusedPher = [];
                for (let i = 0; i < target.length; ++i) {
                    // (1-r)*TARGET + r*AVG
                    let avgPher = pherMerged[pherTypes.get(target[i].type)];
                    let diffusedStr = (1-avgPher.rate)*target[i].strength + avgPher.rate*avgPher.strength;
                    avgPher.strength = diffusedStr;

                    diffusedPher.push(avgPher); // Diffused strength comp.

                    pherTypes.delete(avgPher.type); // Remove from list to complete...
                }

                // For remaining... r*AVG
                for (let type of pherTypes) {
                    // let avgPher = pherTypeArrs[pherTypes.get(type[0])];
                    let avgPher = pherMerged[type[1]];
                    avgPher.strength *= avgPher.rate;

                    diffusedPher.push(avgPher);
                }
                

                // Store diffused on right grid.
                this.set([pos.x,pos.y],diffusedPher,!selLeft);
            }

            return;
        }
        
        // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! MIRROR
        
        // Clear left grid
        this._leftSet.clear();
        this.initSelGrid(!selLeft);

        // Update cells - Will need to first get 1-step neighbors, then update ONLY those cells. Operating on _rightSet
        let initTargets = new Set(this._rightSet);
        // get vonNeumann-neighbors, ensure in-bounds (performed after: at worst sizeOfGrid(n+1)~n^2+2n+1 checks, sizeOfGrid(n+1)-sizeOfGrid(n) removes) VS: (performed during: 4*sizeOfGrid(n)~4n^2 checks, ...)
        for (let pos of this._rightSet) { 
            // console.log(pos.x,pos.y);
            // initTargets.add(new hashmapPosition(pos.x,pos.y)); // Should also be needed...

            initTargets.add(new hashmapPosition(pos.x,pos.y+1));
            initTargets.add(new hashmapPosition(pos.x,pos.y-1));
            initTargets.add(new hashmapPosition(pos.x-1,pos.y));
            initTargets.add(new hashmapPosition(pos.x+1,pos.y));
        }

        // Drop OOB - increase mem cost temporarily to potentially save on compute
        let leftSet = new Set();
        for (let pos of initTargets) {
            if (pos.x >= this._right._spanTopLeft[0] && pos.x < this._right._spanBotRight[0]
                && pos.y >= this._right._spanTopLeft[1] && pos.y < this._right._spanBotRight[1]
            ) {
                leftSet.add(pos);
            }
        }
        // console.log("RIGHTSET:",leftSet);

        // Diffusion (of targeted cells) - needs to handle neighbor merge conflicts, and store to _left.
        // this._leftSet = targets; // Given at least 1 neighbor has value if in targets, diffusion will produce a value in this cell.
        for (let pos of leftSet) {
            // Collect all pheromones. Store as list of pheromonesTypeArrays of pheromone arrays.
            let target = this.get([pos.x,pos.y],selLeft);
            let vnNeighborhood = [
                target, // Target
                this.get([pos.x,pos.y+1],selLeft), // Up,down,left,right
                this.get([pos.x,pos.y-1],selLeft),
                this.get([pos.x-1,pos.y],selLeft),
                this.get([pos.x+1,pos.y],selLeft)
            ];

            let pherTypeArrs = []; // Stores un-merged, typed pheromones
            let pherTypes = new Map(); // Will store [type,index]
            for (let i = 0; i < vnNeighborhood.length; ++i) { // Pher array access
                for (let j = 0; j < vnNeighborhood[i].length; ++j) { // Pher. access
                    if (!pherTypes.has(vnNeighborhood[i][j].type)) {
                        pherTypes.set(vnNeighborhood[i][j].type,pherTypeArrs.length);
                        pherTypeArrs.push([vnNeighborhood[i][j]]); // Push arr of 1 pher
                    } else {
                        pherTypeArrs[pherTypes.get(vnNeighborhood[i][j].type)].push(vnNeighborhood[i][j]); // Push pheromone to typeArrs at typePos
                    }
                }
            }

            // Merge for target rate, stored initial stregnth calc - average value for stregnth
            // VERIFY WHETHER CORRECT DIFFUSION EQUATION WILL BE USED. POTENTIALLY REDUNDANT TARGET VALUE AVERAGED.
            let pherMerged = [];
            for (let i = 0; i < pherTypeArrs.length; ++i) {
                let temp = new Pheromone(pherTypeArrs[i][0].type,0,0,0,0); // (type,strength,initial,rate,evaporate)
                for (let j = 0; j < pherTypeArrs[i].length; ++j) {
                    temp.strength += pherTypeArrs[i][j].strength; // AVERAGED...
                    temp.initial = Math.max(temp.initial,pherTypeArrs[i][j].initial);
                    temp.rate += pherTypeArrs[i][j].rate; // AVERAGED
                    temp.evaporate += pherTypeArrs[i][j].evaporate; // AVERAGED
                }

                temp.strength /= pherTypeArrs[i].length;
                temp.rate /= pherTypeArrs[i].length;
                temp.evaporate /= pherTypeArrs[i].length;

                pherMerged.push(temp);
            }

            // Diffusion with target values
            let diffusedPher = [];
            for (let i = 0; i < target.length; ++i) {
                // (1-r)*TARGET + r*AVG
                let avgPher = pherMerged[pherTypes.get(target[i].type)];
                let diffusedStr = (1-avgPher.rate)*target[i].strength + avgPher.rate*avgPher.strength;
                avgPher.strength = diffusedStr;

                diffusedPher.push(avgPher); // Diffused strength comp.

                pherTypes.delete(avgPher.type); // Remove from list to complete...
            }

            // For remaining... r*AVG
            for (let type of pherTypes) {
                // let avgPher = pherTypeArrs[pherTypes.get(type[0])];
                let avgPher = pherMerged[type[1]];
                avgPher.strength *= avgPher.rate;

                diffusedPher.push(avgPher);
            }
            

            // Store diffused on left grid.
            this.set([pos.x,pos.y],diffusedPher,!selLeft);
        }

        return;
    }

    // For whatever reason, this updates both grids simultaneously?
    evaporate(selLeft=this._selLeft,delThresh=0.05) { // WILL HAVE THRESHOLD (ie. <5% of initial strength, AND WILL DESTROY THAT PHER.)
        console.log(this._leftSet);
        for (let test of this._leftSet) {
            console.log(test);
        }
        
        if (selLeft) { // Left->Right
            // Clear right grid
            this._rightSet.clear();
            this.initSelGrid(!selLeft);

            // Left grid vals:
            for (let target of this._leftSet) {
                let updated = [];
                let init = this.get([target.x,target.y],selLeft); // Get current pheromones
                // console.log(init);

                for (let pher of init) {
                    pher.strength*=(1-pher.evaporate);
                    if (pher.strength/pher.initial > delThresh) {
                        updated.push(pher);
                    }
                }

                // console.log(target,updated,init);
                this.set([target.x,target.y],updated,!selLeft);
            }

            return;
        }

        // MIRROR -----------------------------------------------

        // Clear left grid
        this._leftSet.clear();
        this.initSelGrid(!selLeft);

        // Left grid vals:
        for (let target of this._rightSet) {
            let updated = [];
            let init = this.get([target.x,target.y],selLeft); // Get current pheromones
            // console.log(init);

            for (let pher of init) {
                pher.strength*=(1-pher.evaporate);
                if (pher.strength/pher.initial > delThresh) {
                    updated.push(pher);
                }
            }

            // console.log(target,updated,init);
            this.set([target.x,target.y],updated,!selLeft);
        }
    }

    swapSelGrid() {
        this._selLeft = !this._selLeft;
    }

    //// Rendering:
    render(renderConversion,selLeft=this._selLeft) {
        let cullArea = renderConversion.getPosSpan(); // Get area to render
        cullArea[0][0] = floor(cullArea[0][0]) - 1;
        cullArea[0][1] = floor(cullArea[0][1])+1;
        cullArea[1][0] = floor(cullArea[1][0])+1;
        cullArea[1][1] = floor(cullArea[1][1]) - 1;
            
 
        for (let y = cullArea[0][1]; y >= cullArea[1][1]; --y) {
            for (let x = cullArea[0][0]; x <= cullArea[1][0]; ++x) {
                let tlCoord = renderConversion.convPosToCanvas([x,y]);

                // Want display of MAX and AVG
                let phersAtCell = this.get([x,y],selLeft);
                
                let maxRatio = 0;
                let avgRatio = 0;
                for (let i = 0; i < phersAtCell.length; ++i) {
                    maxRatio = Math.max(maxRatio,phersAtCell[i].strength/phersAtCell[i].initial);
                    avgRatio += phersAtCell[i].strength/phersAtCell[i].initial;
                }
                if (phersAtCell.length != 0) {
                    avgRatio /= phersAtCell.length;
                }
                


                fill(color(255*maxRatio,0,0));
                square(tlCoord[0]-3*TILE_SIZE/10,tlCoord[1]-TILE_SIZE/10,TILE_SIZE/5,TILE_SIZE); //,TILE_SIZE*0.7); // Centered circles

                fill(color(0,255*avgRatio,0));
                square(tlCoord[0]-1*TILE_SIZE/10,tlCoord[1]-TILE_SIZE/10,TILE_SIZE/5,TILE_SIZE); //,TILE_SIZE*0.7); // Centered circles

                fill(color(0,0,0));
                if (phersAtCell.length != 0) {
                    fill(color(0,0,255));
                }
                square(tlCoord[0]+1*TILE_SIZE/10,tlCoord[1]-TILE_SIZE/10,TILE_SIZE/5,TILE_SIZE);

                // push();
                // if (this.get([x,y],selLeft).length*50%255,0,0)
                // fill(color(255,0,0));
                // fill(this.get([x,y],selLeft).length*200,0,0)
                // console.log(this.get([x,y],selLeft).length)
                // if (this.get([x,y],selLeft).length != 0) {
                //     console.log(x,y);
                // }
                // if (selLeft) {
                //     fill(color(this.get([x,y],selLeft).length*50%255,0,0)); // Count of fuckass pheromones
                // } else {
                //     fill(color(0,this.get([x,y],!selLeft).length*50%255,0)); // blue
                // }
                // square(tlCoord[0]-TILE_SIZE/10,tlCoord[1]-TILE_SIZE/10,TILE_SIZE/5,TILE_SIZE); //,TILE_SIZE*0.7); // Centered circles
                // draw();
                // pop();
                // console.log("Rendered ",x,y);
                // console.log(this.get([x,y],selLeft));
            }
        }
    }
}



class hashmapPosition { // Helper object to store in set. NO OTHER USES
    constructor(x,y) {
        this.x = x; this.y = y;

        if (x == -0) { this.x = 0; }
        if (y == -0) { this.y = 0; }
    }

    toString() { 
        return this.x + "_" +this.y; // coerced to string
    }
}

class Pheromone {
    constructor(type,strength,initial,rate,evaporate) {
        this.type = type;
        this.strength = strength;
        this.initial = initial; // Initial strength

        this.rate = rate;
        this.evaporate = evaporate;
    }

    toString() {
        return this.type+":"+this.strength+'/'+this.initial+'';
    }
}


//// String hacky-workaround for Sets. GETTING HASH TO WORK ON CUSTOM CLASS NOT WELL DOCUMENTED.
function convPosToStr(x,y) {
    console.log(x,y);
    return x.toString()+'_'+y.toString();
}

function convArrToStr(arr) {
    return String(arr[0])+'_'+String(arr[1]);
}

function convStrToPos(str) { // Uses hashmapPosition for maximal compat. Can be removed.
    posArr = str.split('_');

    return new hashmapPosition(parseInt(posArr[0]),parseInt(posArr[1]));
}


//// Testing funcs
function testSets() { // SET NOT WORKING CORRECTLY.
    let stringSet = new Set(); // Good.
    stringSet.add("test");
    stringSet.add("test1");
    stringSet.add("test1");
    stringSet.add("test");
    console.log(stringSet);
    
    let temp = new Set();
    let key = new hashmapPosition(2,5);
    
    temp.add(convPosToStr(key.x,key.y));
    temp.add(convPosToStr(1,1));
    temp.add(convPosToStr(1,1));
    temp.add(convPosToStr(-1,-1));
    console.log("-======");
    console.log(temp);

    for (let test of temp) {
        console.log(test);
        console.log(convStrToPos(test));
    } 

    let nextTemp = temp;

    console.log(nextTemp);

    console.log("Check for key retrieve with pos helper:");
    console.log(temp.has(convPosToStr(key.x,key.y)));
}