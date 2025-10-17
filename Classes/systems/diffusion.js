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
        this._rightSet = new Set();
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

    //// Access: (defaults on selected grid) BASED ON ARRAY NOT ON Pos class.
    get(posArr,selLeft=this._selLeft) { // Gets raw pheromone array at position
        if (selLeft) {
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
                this._leftSet.add(posArr);
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
            this._rightSet.add(posArr);
        }
    }

    set(posArr,pheromoneArray,selLeft=this._selLeft) { // ...,  selGet=this._selLeft,selPut=this._selLeft) { // OVERWRITE pheromone array
        if (selLeft) {
            this._left.set(posArr,pheromoneArray); // Grid Update
            
            if (pheromoneArray.length == 0) { // If setting to empty...
                this._leftSet.delete(posArr);
            } else {
                this._leftSet.add(posArr);
            }

            return;
        }
        this._right.set(posArr,pheromoneArray); // Grid Update
            
        if (pheromoneArray.length == 0) { // If setting to empty...
            this._rightSet.delete(posArr);
        } else {
            this._rightSet.add(posArr);
        }

        return;
    }

    wash(posArr,selLeft=this._selLeft) { // Clear pheromones from cell.
        this.set(posArr,[],selLeft);
    }

    //// Diffusion:
    diffuse(selLeft=this._selLeft) { // Will diffuse grid in selLeft -> !selleft. DOES NOT UPDATE _selLeft
        if (selLeft) { // Left grid -> right grid
            // Clear right grid
            this._rightSet.clear();
            this.initSelGrid(!selLeft);

            // Update cells - Will need to first get 1-step neighbors, then update ONLY those cells. Operating on _leftSet
            let initTargets = new Set();
            // get vonNeumann-neighbors, ensure in-bounds (performed after: at worst sizeOfGrid(n+1)~n^2+2n+1 checks, sizeOfGrid(n+1)-sizeOfGrid(n) removes) VS: (performed during: 4*sizeOfGrid(n)~4n^2 checks, ...)
            for (pos in this._leftSet) { 
                // Up,Down,Left,Right neighbors:
                let up = new Pos(pos.x,pos.y+1);
                let down = new Pos(pos.x,pos.y-1);
                let left = new Pos(pos.x-1,pos.y);
                let right = new Pos(pos.x+1,pos.y);
                
                initTargets.add(up);
                initTargets.add(down);
                initTargets.add(left);
                initTargets.add(right);
            }

            // Drop OOB - increase mem cost temporarily to potentially save on compute
            this._rightSet.clear();
            for (pos in initTargets) {
                if (pos.x >= this._left._spanTopLeft[0] && pos.x < this._left._spanBotRight[0]
                    && pos.y >= this._left._spanTopLeft[1] && pos.y < this._left._spanBotRight[1]
                ) {
                    this._rightSet.add(pos);
                }
            }

            // Diffusion (of targeted cells) - needs to handle neighbor merge conflicts, and store to _right.
            // this._rightSet = targets; // Given at least 1 neighbor has value if in targets, diffusion will produce a value in this cell.
            for (pos in this._rightSet) {
                // ...
            }

            return;
        }
    }

    swapSelGrid() {
        this._selLeft = !this._selLeft;
    }
}



class Pos { // Helper object to store in set. NO OTHER USES
    constructor(x,y) {
        this.x = x; this.y = y;
    }

    toString() { 
        return this.x + "_" +this.y; // coerced to string
    }
}

class Pheromone {
    constructor(type,strength,initial) {
        this.type = type;
        this.strength = strength;
        this.initial = initial; // Initial strength
    }

    toString() {
        return this.type+":"+this.strength+'/'+this.initial;
    }
}


//// Testing funcs
function testSets() {
    let temp = new Set();
    let key = new Pos(2,5);
    
    temp.add(key);

    console.log("Check for key retrieve with pos helper:");
    console.log(temp.has(key));
}