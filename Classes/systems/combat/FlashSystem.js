//Based off the final flash from DBZ

class FinalFlash{
    constructor(startX, startY, targetX, targetY, duration = 30000, width = 12){
        this._x = startX;
        this._y = startY;
        this.targetX = targetX;
        this.targetY = targetY;

        this.duration = duration;
        this.width = width;
        this.cooldown = 180000;
    }
}

class FinalFlashManager{
    constructor(){
        this.finalFlash = new FinalFlash();
        this.cooldown = 180000; //3 Minute cooldown (Since it's busted)
        this.lastFire = 0;
        this.canFire = false;
    }

    handleInput(){
        if(mouseIsPressed && this.canFire){
            this.finalFlash.startCharging();
        }
        if(!mouseIsPressed && this.finalFlash.charging){
            this.fireBeam;
        }
    }

    fireBeam(){
        this.canFire = false;
        this.lastFire = millis();
        this.finalFlash.fire();
    }

    update(){
        if(!this.canFire && (millis() - this.lastFire) > this.cooldown){
            this.canFire = 0;
        }
        this.finalFlash.update();
    }
}