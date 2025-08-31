function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(0);
  ellipse(200, 200, 50, 50);


  // Testing CT - ON DEPLOYED, CHECK CONSOLE FOR ERRORS.
  testTer = new Terrain();
  testTer.init(4,16);
}


////// ChunkedTerrain - storage
class Terrain{
  constructor() { // Define vars?
    this._chunkArr = [];
    this._chunkWidthCount = 0;
    this._worldLimits = 0;
  }

  init(chunkWidthCount,chunkWidth) {
    if (chunkWidthCount % 2 == 1) { // Even number of chunks, such {0,0} centered.
      this._chunkWidthCount = chunkWidthCount+1;
    } else if (chunkWidthCount == 0) {
      this._chunkWidthCount = 6; // Setup some arbitrary count, CHANGE LATER
    } else {
      this._chunkWidthCount = chunkWidthCount;
    }
    
    this._worldLimits = (this._chunkWidthCount/2) * chunkWidth;

    for(let i=0; i < this._chunkWidthCount**2; i+=1) {
      // temp = Chunk();
      // temp.init(chunkWidth);
      this._chunkArr.push(new Chunk().init(chunkWidth));
    }
  }

  // ...
}

class Chunk{
  constructor() { // Define vars?
    this._chunkWidth = 0;
    this._chunkData = [];
  }

  init(chunkWidth) {
    this._chunkWidth = chunkWidth; // Set...

    for (let i=0; i < this._chunkWidth**2; i += 1) {
      this._chunkData.push(0); // Fill array with 0s
    }
  }

  //// Util...
  convPos(relX,relY) {
    return relX + relY*this._chunkWidth;
  }


  //// Access...
  getTile(relX,relY) {
    if (0 <= relX < this._chunkWidth & 0 <= relY < this._chunkWidth) {
      return this._chunkData[this.convPos(relX,relY)];
    } else {
      return -1; // Error?
    }
  }

  setTile(relX,relY,val) {
    if (0<=relX<this._chunkWidth & 0<=relY<this._chunkWidth) {
      this._chunkData[this.convPos(relX,relY)] = val;
      return 0; // Success?
    } else {
      return -1;
    }
  }
}