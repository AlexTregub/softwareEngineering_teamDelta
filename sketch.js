let antToSpawn = 0
let ant_Index = 0
let antSize
let antsToCreate = 1
let ants = []
let antImg1

/*
NOTES TO CONSIDER
PUSH() Starts a drawing group
Pop() Ends a drawing group




*/


function preload(){
  antSize = createVector(30,35)
}

function setup() {
  createCanvas(windowWidth*5,windowHeight*5);
  setDefaultBackground()
  for (i=0; i<antsToCreate; i++){
    sizeR = random(0,5)
    ants[i] = new ant((random(0,500)),(random(0,500)),antSize.x+ sizeR,antSize.y + sizeR,30,0)
  }
  antImg1 = loadImage("/Images/Ant_tn.png")
  ants[0].show()
}

function setDefaultBackground(){
  background(60,100,60);
}

function draw(){
  ants[0].update()
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
    ants.splice(antToSpawn,1)
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
  pendingPosX
  pendingPosY

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

  // The ant will randomly move every few seconds. for fun.
  timeUntilSkitter

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
    this.timeUntilSkitter = random(0,500)
    print("ANT %f CREATED", this.antIndex)
    this.pendingPosX = this.GetPosX()
    this.pendingPosY = this.GetPosY()
  }

  //GETTER, SETTERS, RANDOMS
  setTimeUntilSkitter(value){
    this.timeUntilSkitter = value
  }
  rndTimeUntilSkitter(){
    this.timeUntilSkitter = random(0,500)
  }
  getTimeUntilSkitter(){
    return this.timeUntilSkitter
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
    this.pendingPosX = X
    this.pendingPosY = Y
    this.isMoving = true
  }

  getAngle(x1,x2,y1,y2){
    return atan2(x1-x2,y1-y2)
  }

  ResolveMoment()
  {
    while (this.isMoving == true)
      {
      // Need to get the angle, the magnitude, and find the value of how
      // far to move using movementspeed
      this.SetRotation = this.getAngle(this.posX,this.pendingPosX,this.posY,this.pendingPosY)
      let origin = createVector(this.posX,this.posY)
      let destx = createVector(this.pendingPosX,0)
      let desty = createVector(0,this.pendingPosY)
      let newPos = createVector(this.pendingPosX,this.pendingPosY)
      newPos.lerp(origin,newPos,0.1)
      drawArrow(origin, newPos, 'red');

      this.posX = newPos.x
      this.posY = newPos.y
      this.show()
      
//      if (this.posX == this.pendingPosX && this.posY == this.pendingPosY)
//      {
        this.isMoving = false
        print(`Ant %f is at X:${this.posX} Y:${this.posY}`, this.antIndex)
//      }
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

  update(){
    this.timeUntilSkitter -= 1

    if (this.timeUntilSkitter < 0){
      print("ANT %f SKITTER TIME",this.antIndex)
      this.rndTimeUntilSkitter()
      this.isMoving = true
    }

    this.ResolveMoment()
  }
    
}




function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  setDefaultBackground();
}

// Draws an arrow between two vectors.
function drawArrow(base, vec, myColor) {
  angleMode(DEGREES)
  push();
  stroke(myColor);
  strokeWeight(3);
  fill(myColor);
  line(base.x, base.y, vec.x, vec.y);
  rotate(vec.heading());
  pop();
}