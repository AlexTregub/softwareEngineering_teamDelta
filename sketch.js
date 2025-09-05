let ant1;
let ANT_SIZE_X = 20
let ANT_SIZE_y = 15
let ANT_SQUARE = 100
let ant_Index = 0
let ants = []
let antPosX = []
let antPosY = []

function setup() {
  createCanvas(windowWidth,windowHeight);
  background(204);
  // Call handleImage() once the image loads or
  // call handleError() if an error occurs.
  anti = new ant(50,50,20,20,"Entities/Ants/Ant.png",30,0)
  
}

function draw(){

}

function test(){
  for (let i = 0; i < ant_Index; i++){
    ants[i] = antPosX[i]
    antPosX[i] = antPosX[i] + 5
  }
  if (mouseIsPressed()){
    
  }
}

function mousePressed(){
  print("Mouse Pressed");
}


// Display the image.
function handleImage(img) {
  imageMode(CENTER);
  image(img, mouseX, mouseY, ANT_SIZE_X, ANT_SIZE_y);
  
  describe('ant');
}

function antSquare(img){
  imageMode(CENTER);
  
  for (let x=0; x < ANT_SQUARE; x += ANT_SIZE_X + 5){
    for (let y=0; y < ANT_SQUARE; y += ANT_SIZE_y + 5){
      ants[ant_Index] = image(img, mouseX + x, mouseY + y, ANT_SIZE_X, ANT_SIZE_y);
      ant_Index = ant_Index + 1;
      ants[ant_Index] = image(img, mouseX + x, mouseY - y, ANT_SIZE_X, ANT_SIZE_y);
      ant_Index = ant_Index + 1;
      ants[ant_Index] = image(img, mouseX - x, mouseY + y, ANT_SIZE_X, ANT_SIZE_y);
      ant_Index = ant_Index + 1;
      ants[ant_Index] = image(img, mouseX - x, mouseY - y, ANT_SIZE_X, ANT_SIZE_y);
      ant_Index = ant_Index + 1;
    }
  }
}

class ant{
  posX;
  posY;
  sizeX;
  sizeY;

  // the location the ant will move to
  pendingPos;

  // the image url the ant will use
  img;
  
  // the image that will be drawn to the screen
  sprite;

  // the speed that the ant will move in pixels every frame
  // until pos matches PendingPos
  movementSpeed;

  // right now, this seems redundent
  direction;

  // the roation of the sprite, -360 <= x <= 360
  rotation;

  // if isMoving, the ant will move to pendingPos and draw a line to
  // it's pending spot
  isMoving;

  constructor(x,y,sizex,sizey,imageURL,speed,rotation){
    this.SetPosX(x);
    this.SetPosY(y);
    this.SetSizeX(sizex);
    this.SetSizeY(sizey);
    print("ANT CREATED");
    this.SetImg(imageURL)
    this.SetMovementSpeed(speed);
    this.SetRotation(rotation);
  }

  SetPosX(value){
    this.posX = value
  }
  SetPosY(value){
    this.posY = value
  }
  SetSizeX(value){
    this.sizeX = value
  }
  SetSizeY(value){
    this.sizeY = value
  }
  SetImg(value){
    this.img = value
  }
  SetSprite(value){
    imageMode(CENTER);
    this.sprite = image(value,this.posX,this.posY,this.sizeX,this.sizeY)
    image(this.sprite)
  }
  SetMovementSpeed(value){
    this.movementSpeed  = value
  }
  SetDirection(value){
    this.direction  = value
  }
  SetRotation(value){
    this.rotation  = value
    while (this.rotation > 360){
      this.rotation -= 360
    }
    while (this.rotation < -360){
      this.rotation += 360
    }
  }

  moveToLocation(movementVector){
    this.pendingPos = movementVector
    this.isMoving = true
  }

  ResolveMoment(){
    while (isMoving){
      // Need to get the angle, the magnitude, and find the value of how
      // far to move using movementspeed
      let pointX = this.posX + this.movementSpeed * cos(this.rotation);
      let pointY = this.posY - this.movementSpeed * sin(this.rotation);
      this.posX = pointX
      this.posY = pointY
      this.SetSprite(this.img)
      line(this.posX ,this.posY, this.pendingPos.x,this.pendingPos.y)
      if (this.posX == this.pendingPos.x && this.posY == this.pendingPos.y){
        this.isMoving = false
      }
    }
  }
}

// Log the error.
function handleError(event) {
  console.error('Oops!', event);
}
