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

    //// Access: (defaults on selected grid)
    get(pos,selLeft=this._selLeft) { // Gets raw pheromone array at position
        if (selLeft) {
            return this._left.get(pos); 
        }

        return this._right.get(pos);
    }

    push(pos,pheromone,selLeft=this._selLeft) { // Merges ONE pheromone into cell
        // ENSURE MERGE LOGIC IS THE SAME IN BOTH...
        if (selLeft) {
            if (this._leftSet.has(pos)) { // If exists, merge...
                // Key exists...
                let gridAccessPos = this._left.convToFlat(this._left.convPosToArr(pos));
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
                this._left.set(pos,[pheromone]);
                this._leftSet.add(pos);
            }

            return;
        }

        // selRight
        if (this._rightSet.has(pos)) { // If exists, merge...
            // Key exists...
            let gridAccessPos = this._right.convToFlat(this._right.convPosToArr(pos));
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
            this._right.set(pos,[pheromone]);
            this._rightSet.add(pos);
        }
    }

    set(pos,pheromoneArray,selLeft=this._selLeft) { // ...,  selGet=this._selLeft,selPut=this._selLeft) { // OVERWRITE pheromone array
        if (selLeft) {
            this._left.set(pos,pheromoneArray); // Grid Update
            
            if (pheromoneArray.length == 0) { // If setting to empty...
                this._leftSet.delete(pos);
            } else {
                this._leftSet.add(pos);
            }

            return;
        }
        this._right.set(pos,pheromoneArray); // Grid Update
            
        if (pheromoneArray.length == 0) { // If setting to empty...
            this._rightSet.delete(pos);
        } else {
            this._rightSet.add(pos);
        }

        return;
    }
}



class Pos { // Helper object to store in set
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
        this.initial = initial;
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