///// Grid - initial design following idea
class Grid {
    constructor(sizeX,sizeY,spanTopLeft,objLoc) {
        // Array size config
        this._sizeX = sizeX;
        this._sizeY = sizeY;
        this._sizeArr = this._sizeX*this._sizeY;

        this._arr = [];
        for (let i = 0; i < this._sizeArr; ++i) {
            this._arr.push( '\0' ); // Push null objects to fill arr.
        }

        this._spanTopLeft = spanTopLeft; // spanTopleft = (x,y), 
        this._spanBotRight = [spanTopLeft[0]+this._sizeX, spanTopLeft[1]+this._sizeY]; // Automatically set spanBotRight 
        
        this._objLoc = objLoc; // (x,y) GRID object location, not necs.
    }

    //// Util
    convToFlat(pos) { // Convert [x,y] to flat array index
        return pos[1]*this._sizeX + pos[0]; 
    }

    convToSqaure(z) { // Convert flat array index to [x,y]
        return [
            z%this._sizeX,
            floor(z/this._sizeX)
        ];
    }

    convRelToArrPos(pos) { // Convert relative span position to array position 
        return [
            pos[0] - this._spanTopLeft[0],
            pos[1] - this._spanTopLeft[1]
        ];
    }

    convArrToRelPos(pos) { // Convert array position to relative span position 
        return [
            this._spanTopLeft[0] + pos[0],
            this._spanTopLeft[1] + pos[1]
        ];
    }



    //// Access (unrestricted, allows errors/out of bounds for perf., refactor once usage known)
    getArrPos(pos) { // Get value at array-relative position
        return this._arr[this.convToFlat(pos)];
    }

    setArrPos(pos,obj) { // Set value at array-relative position
        this._arr[this.convToFlat(pos)] = obj;
    }

    // Depending on usage, improve perf via direct calls
    get(relPos) { // Gets value based on SPAN positions, no OOB check, how could this go wrong...
        return this._arr[
            this.convToFlat( 
                this.convRelToArrPos(relPos)
            )
        ];
    }

    set(relPos,obj) { // Sets value based on SPAN position, no OOB check.
        this._arr[
            this.convToFlat(
                this.convRelToArrPos(relPos)
            )
        ] = obj;
    }

    // Debug array print:
    print() {
        let line = "";
        for (let i = 0; i < this._sizeArr; ++i) {
            line += (String(this._arr[i]) + ',');

            if (i % this._sizeX == this._sizeX-1) {
                print(line);
                line = "";
                continue;
            }
        }
    }



    //// Modification
    // RESIZE
    // [x,y] ~ new size, and [x,y] of the placement of the old array position (assumes GROWING)
    // IF WE ARE MOVING DATA OUT OF BOUNDS OF NEW ARRAY, THIS MAY/WILL BREAK. IMPLEMENT WHEN NEEDED, OTHERWISE MANUALLY MOVE THINGS
    resize(newSize, oldDataPos = '\0') { 
        let oldArr;
        if (oldDataPos != '\0') {
            oldArr = this._arr; // Old array copy
        }

        // Runs resizing
        this._arr = []; 
        for (let i = 0; i < newSize[0]*newSize[1]; ++i) {
            this._arr.push('\0');
        }

        if (oldDataPos != '\0') { // Assuming we want to retain data:
            for (let j = 0; j < this._sizeArr; ++j) { // j is old array access
                let pos2dOld = this.convToSqaure(j); // Gets OLD position
                let pos2dNew = [
                    oldDataPos[0] + pos2dOld[0],
                    oldDataPos[1] + pos2dOld[1]
                ]

                // Based off of convToFlat(...): pos[1]*this._sizeX + pos[0]
                let pos2dNewFlat = pos2dNew[1]*newSize[0] + pos2dNew[0]; // Does this work? who knows

                this._arr[pos2dNewFlat] = oldArr[j];
            }
        }

        this._sizeX = newSize[0];
        this._sizeY = newSize[1];
        this._sizeArr = this._sizeX * this._sizeY;
    }
}

function testGridUtil() {
    let size = [5,9];
    let testObj = new Grid(size[0],size[1],[0,0],[0,0]);

    for (let i = 0; i < size[0]*size[1]; ++i) {
        let sqr = testObj.convToSqaure(i);
        let flat = testObj.convToFlat(sqr);
        // print(i,sqr,flat);

        let arrPos = testObj.convArrToRelPos(sqr);
        let backPos = testObj.convRelToArrPos(arrPos);
        // print(i,sqr,arrPos,backPos);

        if (sqr[0] != backPos[0] || sqr[1] != backPos[1]) {
            print("ERROR. MISMATCH. Arr->Rel / Rel->Arr Util fail.")
        }

        if (flat != i) {
            print("ERROR. MISMATCH. testGridUtil() fail.")
        }
    }
};

function testGridResize() {
    let size = [5,10];
    let testObj = new Grid(size[0],size[1],[0,0],[0,0]);

    for (let i = 0; i < size[0]*size[1]; ++i) {
        testObj._arr[i] = 1;
    }
    testObj.print();

    testObj.resize([8,11],[3,0]);

    testObj.print();
}