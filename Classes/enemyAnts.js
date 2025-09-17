/*
program an enemy ant
red cast's
if the enemy ants looks toward any ants and the ray from enemy in

vector from the enemy- vision ray- from the enemy ants

---make the patrol
---path find to normal ants and kill ants
---Alex Z with enemy ants-- and ants with cape
--they grow as they eat
*/

// Static Vars.
let eAntToSpawn = 0;
let eAnt_Index = 0;
let eAntSize;
let eAnts = [];
let antDebug = false;


function eAnts_Preloader(){
    eAntSize = createVector(20,20)
    eAntbg = [120, 60, 60]
    eAntImg = loadImage("Images/Ants/enemyAnt.png")
}

function eAnts_Spawn(eNumToSpawn){
    for(let i =0; i <eNumToSpawn; ++i){ 
        spawnRand = random(0,15) 
        //might add a wrapper for species if new specied are added 
        eAnts[i] = new eAnt((random(0,500)), (random(0,500)), eAntSize.x + spawnRand, eAntSize.y + spawnRand, 30, 0) 
        eAnts[i].update() 
    }
}

function eAnts_Update(){ 
    for (let i =0; i < eAnt_Index; i++){ 
        eAnts[i].update() 
    } 
}

//enemy ant class
class eAnt{
    posX
    posY
    sizeX
    sizeY

    pendingPosX
    pendingPosY

    eAntIndex 

    speed

    rotation

    isMoving

    timeUnitlSkitter
    skitterTimer

    eAntMove

    path

    constructor(posX, posY, sizeX, sizeY, speed, rotation){
        this.setPosX(posX)
        this.setPosY(posY)
        this.setSizeX(sizeX)
        this.setSizeY(sizeY)
        this.setMovementSpeed(speed)
        this.setRotation(rotation)
        this.skitterTimer = random(30,200)
        this.eAntIndex = eAnt_Index
        eAnt_Index +=1
        this.isMoving = false
        this.timeUnitlSkitter = this.skitterTimer
        this.pendingPosX = this.getPosX()
        this.pendingPosY = this.getPosY()
        this.AntMove = "RiGHT" 
        if (antDebug) print("ANT %f CREATED", this.eAntIndex)  
    }

    rndTimeUntilSkitter(){ 
        this.timeUntilSkitter = this.skitterTimer 
    }

    render(){ 
        push(); 
        noSmooth(); 
        image(eAntImg,this.posX,this.posY,this.sizeX,this.sizeY) 
        smooth(); 
        pop(); 
    }

    
}

