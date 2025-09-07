let antToSpawn = 0;
let ant_Index = 0;
let antSize;
let ants = [];
let antImg1;
let bg;
let worldSize;

/*
NOTES TO CONSIDER
PUSH() Starts a drawing group
Pop() Ends a drawing group
look into createFrameBuffer() to solve transparancy issues
Im having to draw a green rect to remove old sprites, NOT IDEAL.
I think createFrameBuffer() is a better approach, but ill need
to pretty much rewrite all of the rendering code.
*/

/*
Once transparency issues are resolved, merge with dev branch and 
get this working with the grid and map. 

Next major step will be getting the ants to move in a smooth way
*/

// INIT
function preload(){
  antSize = createVector(20,20)
  bg = [60,100,60]
  antImg1 = loadImage("/Images/Ant_tn.png")
  worldSize = createVector(windowWidth*5,windowHeight*5)
}

function setup() {
  createCanvas(worldSize.x,worldSize.y);
  setDefaultBackground()
  Ants_Spawn(150)
}

function draw(){
  Ants_Update();
}


// ANT UTILITY

// Spawns a set number of ants
function Ants_Spawn(numToSpawn) {
  for (let i = 0; i < numToSpawn; i++){
    sizeR = random(0,15)
    ants[i] = new ant((random(0,500)),(random(0,500)),antSize.x+ sizeR,antSize.y + sizeR,30,0)
    ants[i].update()
  }
}

// updates and rerenders all ants
function Ants_Update(){
  for (let i = 0; i < ant_Index; i++) {
    ants[i].update()
  }
}

// TEST, moves all ants a bit in passed direction
function Ants_moveAsGroup(direction, movement) {
  switch(direction){
    case "RIGHT":
      for (let i = 0; i < ant_Index; i++) {
      ants[i].moveToLocation(ants[i].GetPosX() + movement, ants[i].GetPosY())
      }
    case "LEFT":
      for (let i = 0; i < ant_Index; i++) {
      ants[i].moveToLocation(ants[i].GetPosX() - movement, ants[i].GetPosY())
      }
    case "UP":
      for (let i = 0; i < ant_Index; i++) {
      ants[i].moveToLocation(ants[i].GetPosX(), ants[i].GetPosY() + movement)
      }
    case "DOWN":
      for (let i = 0; i < ant_Index; i++) {
      ants[i].moveToLocation(ants[i].GetPosX(), ants[i].GetPosY() - movement)
      }
  }
}

function Controls(){
  
}

// MOUSE FUNCTIONS
function mousePressed(){
  print("Mouse Pressed");
  ants[antToSpawn].moveToLocation(mouseX,mouseY)
  antToSpawn += 1
  if (antToSpawn >= ant_Index)
  {
    antToSpawn = 0
  }
}

function windowResized() {
  resizeCanvas(worldSize.x, worldSize.y);
  setDefaultBackground();
}

function setDefaultBackground(){
  background(bg);
}


// CLASSES
class ant{
  posX
  posY
  sizeX
  sizeY
  antIndex

  // the location the ant will move to
  pendingPosX
  pendingPosY

  // the image url the ant will use **Currently not in use**
  //img

  // the speed that the ant will move in pixels every frame
  // until pos matches PendingPos
  movementSpeed

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
    this.timeUntilSkitter = random(5,20)
    this.pendingPosX = this.GetPosX()
    this.pendingPosY = this.GetPosY()

     print("ANT %f CREATED", this.antIndex)
  }

  //GETTER, SETTERS, RANDOMS
  setTimeUntilSkitter(value){
    this.timeUntilSkitter = value
  }
  rndTimeUntilSkitter(){
    this.timeUntilSkitter = random(5,20)
  }
  getTimeUntilSkitter(){
    return this.timeUntilSkitter
  }

  // Sets and returns top left point relative to sprite
  SetPosX(value){
    this.posX = value
    print("ANT POS X:%f",this.posX)
  }
  SetPosY(value){
    this.posY = value
    print("ANT POS Y:%f",this.posY)
  }
  GetPosX(){
    return this.posX 
  }
  GetPosY(){
    return this.posY 
  }

  // Gets the mid point relative to sprite
  // Use this if you need an effect to be centered on the sprite
  GetCenter(){
    return createVector(this.posX + (this.sizeX / 2),
                        this.posY + (this.sizeY / 2))
  }

  SetSizeX(value){
    this.sizeX = value
    print("ANT SIZE X:%f",this.sizeX)
  }
  SetSizeY(value){
    this.sizeY = value
    print("ANT SIZE Y:%f",this.sizeY)
  }
  GetSizeX(){
    return this.sizeX
  }
  GetSizeY(){
    return this.sizeY
  }

  // Sets/Gets the image of the sprite to rendered to screen
  SetImg(value){
    this.img = value
  }
  GetImg(){
    return this.img
  }

  // Sets the image of the sprite to rendered to screen
  SetMovementSpeed(value){
    this.movementSpeed  = value
    print("ANT MOVEMENT SPEED:%f",this.movementSpeed)
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

  // if isMoving is true, the ant will calculate a vector to a given pos
  // The ant will draw a ellipse over it's old sprite,
  // then will jump to that location and render itself.
  // PLANS --------------------------------------------
  // Ants jumping to the location they want to go is not the desired behavior
  // the code needs to have the ant move the amount dictated by movement speed
  // and know the movement is resolved, stop moving and resume skittering.
  ResolveMoment()
  {
    while (this.isMoving == true)
      {
      this.SetRotation = this.getAngle(this.posX,this.pendingPosX,this.posY,this.pendingPosY)
      let origin = createVector(this.posX,this.posY)
      let newPos = createVector(this.pendingPosX,this.pendingPosY)
      newPos.lerp(origin,newPos,0.1)
      this.fillOldImage()

      this.posX = newPos.x
      this.posY = newPos.y
      this.render()

      this.isMoving = false
      //print(`Ant %f is at X:${this.posX} Y:${this.posY}`, this.antIndex)

    }
  }

  render(){
    image(antImg1,this.posX,this.posY,this.sizeX,this.sizeY)
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

  // Fills in the space the ant just was. This is to avoid overlapping 
  // ant sprites, think windows XP dragging crashing windows
  fillOldImage() {
    push();
    fill(bg);
    ellipseMode(RADIUS);
    noStroke();
    ellipse(this.GetCenter().x,this.GetCenter().y,this.GetSizeX()-7);
    pop();
  }

  update(){
    if (this.isMoving == false) {
      this.timeUntilSkitter -= 1
    }
    if (this.timeUntilSkitter < 0){
      this.rndTimeUntilSkitter()
      this.isMoving = true
      this.moveToLocation(this.posX + random(-5,5),this.posY + random(-5,5))
    }

    this.ResolveMoment()
        
  }


    
}


