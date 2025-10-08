///// Grid - initial design following idea
///// NONE constant is now defined outside. 
///// Treat _ as private, else as public.
let GRID_ID = 0;

class Grid {
    constructor(sizeX,sizeY,spanTopLeft=NONE,objLoc=[0,0]) { // Only Size needed
        // Array size config
        this._sizeX = sizeX;
        this._sizeY = sizeY;
        this._sizeArr = this._sizeX*this._sizeY;

        this.rawArray = []; // Treat as public.
        for (let i = 0; i < this._sizeArr; ++i) {
            this.rawArray.push(NONE); // Push objects to fill arr.
        }

        this._spanEnabled = (spanTopLeft == NONE) ? false : true; // Conditional statements are valid
        this._spanTopLeft = spanTopLeft; // spanTopleft = (x,y), 
        this._spanBotRight = [spanTopLeft[0]+this._sizeX, spanTopLeft[1]+this._sizeY]; // Automatically set spanBotRight 
        
        this._objLoc = objLoc; // (x,y) GRID object location, not necs.

        this._gridId = GRID_ID++; // DEBUG ID, 0 INDEXED.
    }

    //// Util - NO OOB CHECKS
    convToFlat(pos) { // Convert [x,y] to flat array index
        return pos[1]*this._sizeX + pos[0]; 
    }

    convToSquare(z) { // Convert flat array index to [x,y]
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



    //// Access data (unrestricted, allows errors/out of bounds for perf., refactor once usage known)
    // Allowing out of bounds, logging when.
    getArrPos(pos) { // Get value at array-relative position
        if (pos[0] >= this._sizeX || pos[0] < 0 || pos[1] >= this._sizeY || pos[1] < 0 ) {
            print("In "+this.infoStr()+" get access OutOfBounds. raw array pos ("+pos+')');
        }

        let val = this.rawArray[this.convToFlat(pos)];
        if (val == NONE) {
            print("In "+this.infoStr()+" got NONE value. raw array pos ("+pos+')');
        }
        if (val == undefined) {
            print("In "+this.infoStr()+" read past array. raw array pos ("+pos+')');
        }
        return val;
    }

    setArrPos(pos,obj) { // Set value at array-relative position
        // if (pos[0] >= this._sizeX || pos[1] >= this._sizeY) {
        if (pos[0] >= this._sizeX || pos[0] < 0 || pos[1] >= this._sizeY || pos[1] < 0) {
            print("In "+this.infoStr()+" set access OutOfBounds. raw array pos ("+pos+')');
        }
        this.rawArray[this.convToFlat(pos)] = obj;
    }

    // Depending on usage, improve perf via direct calls
    get(relPos) { // Gets value based on SPAN positions, no OOB check, how could this go wrong...
        // NEED: spanTopLeft.x<=relPos.x<spanBotRight.x && ...
        // Aka error if: relPos[0]<spanTopLeft[0] || relPos[0]>=spanBotRight[0] || ...
        if (!this._spanEnabled) {
            print("In "+this.infoStr()+" attempting get access when span is not defined. span pos ("+relPos+"), raw array pos ("+this.convRelToArrPos(relPos)+')');
        }
        if (relPos[0]<this._spanTopLeft[0] || relPos[0]>=this._spanBotRight[0] || relPos[1]<this._spanTopLeft[1] || relPos[1]>=this._spanBotRight[1]) {
            print("In "+this.infoStr()+" get access OutOfBounds. span pos ("+relPos+"), raw array pos ("+this.convRelToArrPos(relPos)+')');
        }
        
        let val = this.rawArray[
            this.convToFlat( 
                this.convRelToArrPos(relPos)
            )
        ];
        if (val == NONE) {
            print("In "+this.infoStr()+" got NONE value. span pos ("+relPos+"), raw array pos ("+this.convRelToArrPos(relPos)+')');
        }
        if (val == undefined) {
            print("In "+this.infoStr()+" read past array. raw array pos ("+relPos+')');
        }

        return val;
    }

    set(relPos,obj) { // Sets value based on SPAN position, no OOB check.
        if (!this._spanEnabled) {
            print("In "+this.infoStr()+" attempting get access when span is not defined. span pos ("+relPos+"), raw array pos ("+this.convRelToArrPos(relPos)+')');
        }
        if (relPos[0]<this._spanTopLeft[0] || relPos[0]>=this._spanBotRight[0] || relPos[1]<this._spanTopLeft[1] || relPos[1]>=this._spanBotRight[1]) {
            print("In "+this.infoStr()+" set access OutOfBounds. span pos ("+relPos+"), raw array pos ("+this.convRelToArrPos(relPos)+')');
        }
        
        this.rawArray[
            this.convToFlat(
                this.convRelToArrPos(relPos)
            )
        ] = obj;
    }



    //// DEBUG:
    print() {
        let line = "";
        for (let i = 0; i < this._sizeArr; ++i) {
            line += (this.rawArray[i] + ',');

            if (i % this._sizeX == this._sizeX-1) {
                print(line);
                line = "";
                continue;
            }
        }
    }

    infoStr() {
        return "Grid#"+this._gridId+"_[size:("+this._sizeX+','+this._sizeY+"),span:"+this._spanEnabled+",(("+this._spanTopLeft+"),("+this._spanBotRight+")),loc:"+this._objLoc+']';
    }



    //// Modification/info of struct
    // Grid size
    getSize() {
        return [this._sizeX,this._sizeY];
    }
    
    // RESIZE // setSize
    // [x,y] ~ new size, and [x,y] of the placement of the old array position (assumes GROWING)
    // IF WE ARE MOVING DATA OUT OF BOUNDS OF NEW ARRAY, THIS MAY/WILL BREAK. IMPLEMENT WHEN NEEDED, OTHERWISE MANUALLY MOVE THINGS
    // 
    // FOUND BUG: IF DATA MOVED OOB, RESIZE MAY WRITE PAST KNOWN RANGE OF ARRAY. THIS IS TORTURING KITTENS. DO NOT RESIZE OOB.
    //
    resize(newSize, oldDataPos = NONE) { 
        if (oldDataPos != NONE) { // Run bounds check (ie. old grid fits)
            // HERE BOUNDARY CHECKS ARE INCLUSIVE???
            // Check top left in newSize:
            // (pos[0] >= this._sizeX || pos[0] < 0 || pos[1] >= this._sizeY || pos[1] < 0)
            if (oldDataPos[0] > newSize[0] || oldDataPos[0] < 0 || oldDataPos[1] > newSize[1] || oldDataPos[1] < 0) {
                print("In "+this.infoStr()+" resize old data top left position out of bounds. new size ("+newSize+"), topLeftPos ("+oldDataPos+')');
            }

            let botRight = [ oldDataPos[0]+this._sizeX, oldDataPos[1]+this._sizeY ];
            if (botRight[0] > newSize[0] || botRight[0] < 0 || botRight[1] > newSize[1] || botRight[1] < 0) {
                print("In "+this.infoStr()+" resize old data bottom right position out of bounds. new size ("+newSize+"), botRightPos ("+botRight+')');
            }
        }

        let oldArr;
        if (oldDataPos != NONE) {
            oldArr = this.rawArray; // Old array copy
        }

        // Setup New Array
        this.rawArray = NONE;
        this.rawArray = []; 
        for (let i = 0; i < newSize[0]*newSize[1]; ++i) {
            this.rawArray.push(NONE);
        }

        // If selected: copy over
        if (oldDataPos != NONE) { // Assuming we want to retain data:
            for (let j = 0; j < this._sizeArr; ++j) { // j is old array access
                let pos2dOld = this.convToSqaure(j); // Gets OLD position
                let pos2dNew = [
                    oldDataPos[0] + pos2dOld[0],
                    oldDataPos[1] + pos2dOld[1]
                ]

                // Based off of convToFlat(...): pos[1]*this._sizeX + pos[0]
                let pos2dNewFlat = pos2dNew[1]*newSize[0] + pos2dNew[0]; // Does this work? who knows

                this.rawArray[pos2dNewFlat] = oldArr[j];
            }
        }

        // If moving old data, also update span if needed:
        if (oldDataPos != NONE && this._spanEnabled) {
            // Set top left, then update right
            this._spanTopLeft[0] = this._spanTopLeft[0] - oldDataPos[0];
            this._spanTopLeft[1] = this._spanTopLeft[1] - oldDataPos[1];

            this._spanBotRight = [this._spanTopLeft[0]+newSize[0], this._spanTopLeft[1]+newSize[1]];
        }

        // Update Size
        this._sizeX = newSize[0];
        this._sizeY = newSize[1];
        this._sizeArr = this._sizeX * this._sizeY;
    }

    // Grid-span range
    getSpanRange() { // Returns pair of coordinates, one top left, one top right.
        return [this._spanTopLeft,this._spanBotRight];
    }

    setSpanCorner(topLeftPos) {
        this._spanEnabled = true;
        this._spanTopLeft = topLeftPos;

        this._spanBotRight = [spanTopLeft[0]+this._sizeX, spanTopLeft[1]+this._sizeY]; // Automatically set spanBotRight 
    }

    // Grid-object position
    getObjPos() {
        return this._objLoc;
    }

    setObjPos(newPos) {
        this._objLoc = newPos;
    }

    // Treat as read-only
    getGridId() {
        return this._gridId;
    }

    // Empties data, reset to blank state.
    clear() {
        this.resize([0,0]); // Empty array
        
        this._spanEnabled = false; // Reset span state
        this._objLoc = [0,0]; // Reset object location
    }
}



//// Test of "beautiful" code
function testGridUtil() {
    let size = [5,9];
    let testObj = new Grid(size[0],size[1],[0,0],[0,0]);

    for (let i = 0; i < size[0]*size[1]; ++i) {
        let sqr = testObj.convToSquare(i);
        let flat = testObj.convToFlat(sqr);
        print(i,sqr,flat);

        let arrPos = testObj.convArrToRelPos(sqr);
        let backPos = testObj.convRelToArrPos(arrPos);
        print(i,sqr,arrPos,backPos);

        if (sqr[0] != backPos[0] || sqr[1] != backPos[1]) {
            print("ERROR. MISMATCH. Arr->Rel / Rel->Arr Util fail.")
        }

        if (flat != i) {
            print("ERROR. MISMATCH. testGridUtil() fail.")
        }
    }
};

function testGridResizeAndConsequences() {
    let size = [5,10];
    let testObj = new Grid(size[0],size[1],[0,0],[0,0]);

    for (let i = 0; i < size[0]*size[1]; ++i) {
        testObj.rawArray[i] = i;
        if (i == size[0]*size[1]-1) {
            testObj.rawArray[i] = 0;
        }
    }
    testObj.print();

    testObj.resize([8,11],[3,0]);

    /*
    Returns:
    (initial array)
    10p5.min.js:60787 (10) 1,1,1,1,1, 

    (resized array, \0 used for unset values, no None object in p5js?)
    10p5.min.js:60787 (10)  , , ,1,1,1,1,1,
    p5.min.js:60787         , , , , , , , ,
    */

    testObj.print();

    // Following should warn.
    print("Example of resize OOB: (also shifting grid)")
    testObj.resize([8,11],[0,1]);
    testObj.print();

    // Access error tests:
    print(testObj.getArrPos([7,10]));
    print(testObj.getArrPos([8,11]));
    print(testObj.getArrPos([7,11])); // If returns NONE, proof resize writes OUT OF RANGE. 

    print("Success followed by fails");
    print(testObj.get([4,9])); // Bottom right corner - exists
    print(testObj.get([5,10]));
    print(testObj.get([4,10]))

    print(testObj.infoStr());

    //...
    testObj.clear();
    print(testObj.infoStr());
}