let antToSpawn = 0
let ANT_SIZE_X = 20
let ANT_SIZE_y = 15
let ANT_SQUARE = 100
let ant_Index = 0
let ants = []
let antPosX = []
let antPosY = []
let antImg1


function setup() {
  createCanvas(windowWidth*5,windowHeight*5);
  setDefaultBackground()
  // Call handle,Image() once the image loads or
  // call handleError() if an error occurs.
  for (i=0; i<10; i++){
    ants[i] = new ant(50 + (i *10),100 + (i *10),20,15,30,0)
  }
  antImg1 = loadImage("/Images/Ant_tn.png")
}

function setDefaultBackground(){
  background(60,100,60);
}

function draw(){
}


function test(){
  for (let i = 0; i < ant_Index; i++){
    ants[i] = antPosX[i]
    antPosX[i] = antPosX[i] + 5
  }
}

function mousePressed(){
  print("Mouse Pressed");
  ants[antToSpawn].moveToLocation(mouseX,mouseY)
  ants[antToSpawn].show()
  antToSpawn += 1
  if (antToSpawn >= ant_Index)
  {
    antToSpawn = 0
  }
}

class ant{
  posX
  posY
  sizeX
  sizeY

  antIndex

  // the location the ant will move to
  pendingPos

  // the image url the ant will use
  //img
  
  // the image that will be drawn to the screen
  sprite

  // the speed that the ant will move in pixels every frame
  // until pos matches PendingPos
  movementSpeed

  // right now, this seems redundent
  direction

  // the roation of the sprite, -360 <= x <= 360
  rotation

  // if isMoving, the ant will move to pendingPos and draw a line to
  // it's pending spot
  isMoving

  constructor(posX,posY,sizex,sizey,speed,rotation){
    this.SetPosX(posX)
    this.SetPosY(posY)
    this.SetSizeX(sizex)
    this.SetSizeY(sizey)
    //this.SetImg(imageURL)
    this.SetMovementSpeed(speed)
    this.SetRotation(rotation)
    this.antIndex = ant_Index
    ant_Index += 1
    this.isMoving = false
    print("ANT %f CREATED", this.antIndex)
  }


  SetPosX(value){
    this.posX = value
    print("ANT POS X:%f",this.posX)
  }
  GetPosX(){
    return this.posX 
  }


  SetPosY(value){
    this.posY = value
    print("ANT POS Y:%f",this.posY)
  }
  GetPosY(){
    return this.posY 
  }


  SetSizeX(value){
    this.sizeX = value
    print("ANT SIZE X:%f",this.sizeX)
  }
  GetSizeX(){
    return this.sizeX
  }


  SetSizeY(value){
    this.sizeY = value
    print("ANT SIZE Y:%f",this.sizeY)
  }
  GetSizeY(){
    return this.sizeY
  }


  SetImg(value){
    this.img = value
  }
  GetImg(){
    return this.img
  }


  SetSprite(){
    imageMode(CENTER);
    image(img,this.posX,this.posY,this.sizeX,this.sizeY)
  }


  SetMovementSpeed(value){
    this.movementSpeed  = value
    print("ANT MOVEMENT SPEED:%f",this.movementSpeed)
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
    print("ANT ROTATION:%f",this.rotation)
  }

  moveToLocation(X,Y){
    this.pendingPos = createVector(X,Y)
    this.isMoving = true
  }

  ResolveMoment()
  {
    while (this.isMoving == true)
      {
      // Need to get the angle, the magnitude, and find the value of how
      // far to move using movementspeed
      print("Ant %f is moving to X:1 Y:2", this.antIndex)
      let pointX = this.posX + this.movementSpeed * cos(this.rotation);
      let pointY = this.posY - this.movementSpeed * sin(this.rotation);
      this.posX = pointX
      this.posY = pointY
      line(this.posX ,this.posY, this.pendingPos.x,this.pendingPos.y)
      if (this.posX == this.pendingPos.x && this.posY == this.pendingPos.y)
      {
        this.isMoving = false
      }
    }
  }

  show(){
    image(antImg1,this.posX,this.posY,this.sizeX,this.sizeY)
  //img = loadImage("/Images/Ant_tn.png",this.handleImage,this.handleError)
  // image(this.img,50,50,50,50)
  
  }

    // Log the error.
  handleError(event_) {
    console.error('Oops!', event_);
  }

  // Display the image.
  handleImage(img) {
    imageMode(CENTER);
    //image(img, this.posX, this.posY, this.sizeX, this.sizeY);
    
    describe('ant');
  }
    
}




function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  setDefaultBackground();
}