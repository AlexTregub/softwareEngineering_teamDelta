class FinalFlash{
    /*Final Flash
        Should be like final flash from DBZ
            Beam that charges as you hold down
            Multiple layers for shading effect
            Damage enemies in its path
            Fades after time
            Shoots whatever direction mouse points at
            Should be parabolic shape?
            MAKE SURE TO ADD FUN MUSIC
    */
    constructor(startX, startY, targetX, targetY){
        //Position Info
        this._x = startX;
        this._y = startY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.angle = atan2(targetY - _y, targetX - _x);

        //Constant Beam info
        this.duration = 7000; //7 seconds
        this.width = 12;
        this.length = 20000; //Spans larger than the map (Grandiose (as it should be))
        this.damage = 0; //Damage increases over charge time
        this.beamSpeed = 700; //700 pixles per second

        //Beam specific info
        this.charging = false;
    }
}

class FinalFlashManager{
    constructor(){
        this.finalFlash = null;
        this.cooldown = 180000; //3 Minute cooldown (Since it's busted)
        this.lastFire = 0;
        this.canFire = false;
    }

    createFlash(startX, startY, targetX, targetY){
        this.finalFlash = new FinalFlash(startX, startY, targetX, targetY); //Can only have one
    }

    handleInput(){
        if(mouseIsPressed && this.canFire){ //If mouse pressed and cooldown over
            this.finalFlash.startCharging(); //Charge (starts power)
        }
        if(!mouseIsPressed && this.finalFlash.charging){ //If mouse let go while charging
            this.fireBeam(); //Fire final flash
        }
    }

    fireBeam(){ //Fires beams and resets counters
        this.canFire = false;
        this.lastFire = millis();
        this.finalFlash.fire();
    }

    update(){
        if(!this.canFire && (millis() - this.lastFire) > this.cooldown){ //If on cooldown and cooldown over
            this.canFire = true; //Allow next attack
        }
        this.finalFlash.update(); //Update final flash
    }
}