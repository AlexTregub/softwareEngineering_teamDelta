//All the powers in one nice place

class Power{
    constructor(damage = 0, x, y, type = "strike", name){
        this.damage = damage;
        this.x_ = x;
        this.y_ = y;
        this.type_ = type;
        this.name_ = name;
        this.created = millis();
        this.lastStrike = 0;
        this.canUse = true;
    }
    activate(){}
    update(){}
    render(){}
}

class Lightning extends Power{
    constructor(damage, x, y, name){
        super(damage, x, y, "strike", name);
        this.radius = 1 * 3; //One could be swapped with Math.random()
        this.cooldown = 1000; // 1 second cooldown
        this.duration = 100;
        this.lastStrike = 0;
        this.isActive = false;
    }
    
    activate(){
        console.log(`lightning strike!!!`);
        const now = millis();
        // Check if enough time has passed since last strike
        if (now - this.lastStrike < this.cooldown){
            const timeLeft = ((this.cooldown - (now - this.lastStrike)) / 1000);
            return false;
        }
        
        this.lastStrike = now;
        this.created = now;
        this.isActive = true;
        
        // Apply damage to nearby ants
        if(typeof ants !== 'undefined' && Array.isArray(ants)){
            const aoeRadius = TILE_SIZE * this.radius;
            for (const ant of ants) {
                if (!ant || !ant.isActive) continue;
                // Skip the queen
                if (ant.jobName === 'Queen' || ant.job === 'Queen') continue;
                
                const antPos = ant.getPosition ? ant.getPosition() : {x: ant.x || 0, y: ant.y || 0};
                const distance = Math.hypot(antPos.x - this.x_, antPos.y - this.y_);
                
                if (distance <= aoeRadius){
                    if (typeof ant.takeDamage === 'function'){
                        ant.takeDamage(this.damage);
                    }
                }
            }
        }
        
        // Play strike sound
        if(typeof soundManager !== 'undefined'){
            soundManager.play('lightningStrike');
        }
        
        return true;
    }
    
    render(){
        const t = (millis() - this.created) / this.duration;

        let screenX = this.x_;
        let screenY = this.y_;

        if(typeof g_activeMap !== 'undefined' && g_activeMap && g_activeMap.renderConversion && typeof TILE_SIZE !== 'undefined') {
            const tileX = this.x_ / TILE_SIZE;
            const tileY = this.y_ / TILE_SIZE;
            const screenPos = g_activeMap.renderConversion.convPosToCanvas([tileX, tileY]);
            screenX = screenPos[0];
            screenY = screenPos[1];
        }
        
        push();
        stroke(200, 230, 255, 255 * (1-t));
        strokeWeight(3);
        // Simple top-to-target lightning line (jittered)
        const startX = screenX + (Math.random() - 0.5) * 8;
        const startY = -10; // from above the canvas
        const midX = screenX + (Math.random() - 0.5) * 20;
        const midY = screenY - (50 * (1 - t));
        line(startX, startY, midX, midY);
        line(midX, midY, screenX, screenY);
        pop();
        console.log("Rendering lightning power");
    }
    update(){
        const now = millis();
        
        if(this.isActive && now - this.created >= this.duration){
            this.isActive = false;
        }
        
        if(this.isActive){
            //Update visual effects (Not added yet)
        }
    }
}

class FinalFlash extends Power{
    constructor(damage, x, y, name){
        super(damage, x, y, "beam", name);
        // Beam properties
        this.width = 0.005; // Controls how wide the beam fans out
        this.cooldown = 180000; // 3 minute cooldown
        this.duration = 34000; // How long beam stays active. Goes to end of sound
        this.fadeDuration = 500;
        this.beamSpeed = 700; // How fast grows
        this.maxLength = 20000; // Max beam length (Covers entire map)
        this.movementSpeed = getQueen().movementSpeed; // Store original movement speed

        this.lastStrike = 0;
        this.isActive = false;
        this.isCharging = false;
        this.chargedPower = 1.0;
        this.isBeamFading = false;
        this.mousePressTime = 0;
        this.beamFadeStartTime = 0;
        this.startTime = 0;
        this.angle = 0;
        this.wasMousePressed = false; // Track previous mouse state
        
        this.targetX = x;
        this.targetY = y;
        this.buildupPlayed = false;
    }

    activate(){
        if(!this.isCharging){
            //Starts beam charging
            this.isCharging = true;
            this.mousePressTime = millis();
            return true;
        }
        //Or else returns false (if charging already)
        return false;
    }

    fire(){
            if(this.isCharging){
            this.isCharging = false; //Resets charge
            this.isDelaying = true; //Starts delay
            soundManager.stop("finalFlashCharge");
            soundManager.play("finalFlash"); //Absolute Cinema
            
            setTimeout(()=>{
                //Sets settings for beam firing
                this.isDelaying = false;
                this.isActive = true;
                this.isBeamFading = false;
                this.startTime = millis();
                this.lastStrike = millis();
                this.buildupPlayed = false;
            }, 57000); //Set to 57000 to match sound (57 sec)
            return true;
        }
        return false;
    }

    render(){
        // Get queen's position for beam origin
        let screenX, screenY;
        if (typeof queenAnt !== 'undefined' && queenAnt){
            const queenPos = queenAnt.getPosition ? queenAnt.getPosition() : {x: queenAnt.x || 0, y: queenAnt.y || 0};
            
            // Convert queen's world coordinates to screen coordinates (just stole DW's code)
            if (typeof g_activeMap !== 'undefined' && g_activeMap && g_activeMap.renderConversion && typeof TILE_SIZE !== 'undefined') {
                const tileX = queenPos.x / TILE_SIZE;
                const tileY = queenPos.y / TILE_SIZE;
                const screenPos = g_activeMap.renderConversion.convPosToCanvas([tileX, tileY]);
                screenX = screenPos[0];
                screenY = screenPos[1];
            }
            else{
                screenX = queenPos.x;
                screenY = queenPos.y;
            }
        }
        else{
            screenX = this.x_;
            screenY = this.y_;
        }

        const now = millis(); //Current time
        const t = (now - this.startTime) / 400; //Gets time since beam start
        const L = this.isActive ? min(this.beamSpeed * t, this.maxLength) : 0; //Gets current beam length

        if(this.isCharging){
            if(!this.buildupPlayed){
                soundManager.play("finalFlashCharge");
                this.buildupPlayed = true;
            }
            //Gets time the mouse was held down
            const pressDuration = now - this.mousePressTime;
            this.chargedPower = min((pressDuration / 1000) * 0.1, 3.0); //Max 3x strength, slow buildup
        }

        //Angle between queen and target
        this.angle = atan2(this.targetY - screenY, this.targetX - screenX);

        //Draw beam if active and not completely faded
        if(this.isActive && !(this.isBeamFading && now - this.beamFadeStartTime >= this.fadeDuration)){
            push();
            translate(screenX, screenY);
            rotate(this.angle); //Rotate to face target
            
            let fadeProgress = 0;
            if(this.isBeamFading){
                //If beam is fading, progress is the time since fade divided by total length
                fadeProgress = min((now - this.beamFadeStartTime) / this.fadeDuration, 1.0);
            }
            
            const pulseSpeed = 0.05; //Speed of beam pulse
            const pulseIntensity = 0.15; //Degree of pulse
            const pulseEffect = 1 + sin(now * pulseSpeed) * pulseIntensity;
            
            const currentAlpha = this.width * this.chargedPower * pulseEffect; //Scales with charge time
            const glowOpacity = 80 * this.chargedPower * pulseEffect;
            const coreOpacity = 200 * min(this.chargedPower * pulseEffect, 1.8); //Increased max to allow for pulse
            
            //Opacity fades with beam
            const finalGlowOpacity = this.isBeamFading ? glowOpacity * (1 - fadeProgress) : glowOpacity;
            const finalCoreOpacity = this.isBeamFading ? coreOpacity * (1 - fadeProgress) : coreOpacity;
            
            //Outer glow
            fill(255, 255, 100, finalGlowOpacity);
            this.drawBeam(L, currentAlpha * 2, fadeProgress);

            //Middle glow
            fill(255, 255, 100, finalGlowOpacity * 0.75);
            this.drawBeam(L, currentAlpha * 1.4, fadeProgress);

            //Core
            fill(255, 255, 0, finalCoreOpacity);
            this.drawBeam(L, currentAlpha, fadeProgress);

            pop();
        }

        if (!this.isActive){
            //Ball only charges before firing
            this.drawOriginEffect(getQueen().getScreenPosition().x, getQueen().getScreenPosition().y);
        }
    }

    drawOriginEffect(x, y){
        const baseSize = 30;
        let sourceSize = baseSize;
        let sourceBrightness = 120;

        if (this.isCharging){ //While growing
            //Increase size
            const sizeMultiplier = 1.0 + (this.chargedPower - 1.0) * 0.8;
            sourceSize = baseSize * sizeMultiplier;
            
            //Increase pulse rate
            const pulseRate = 0.01 + (this.chargedPower - 1.0) * 0.02;
            const pulseIntensity = 10 + (this.chargedPower - 1.0) * 5;
            const pulse = pulseIntensity * sin(millis() * pulseRate);
            
            //Increase final size & brightness
            sourceSize += pulse;
            sourceBrightness = 120 + 100 * sin(millis() * pulseRate);
        }
        else if (this.isActive){
            sourceSize = baseSize * min(this.chargedPower, 1.5);
            sourceBrightness = 120 * min(this.chargedPower, 2.0);
        }

        push();
        fill(255, 255, sourceBrightness);
        ellipse(x, y, sourceSize, sourceSize);
        pop();
    }

    drawBeam(length, a, fadeProgress = 0){
        //Stuff for quadratic shape
        const flareLength = 100;
        const maxWidth = a * flareLength * flareLength;
        const widthMultiplier = 1.0 - fadeProgress;

        beginShape();
        //Upper Half
        for (let x = 0; x <= length; x += 10) {
            const w = (x < flareLength) ? maxWidth * sin((x / flareLength) * HALF_PI) : maxWidth;
            vertex(x, -w * widthMultiplier);
        }
        //Bottom Half - Like how you break a horizontal polynomial into the positive and negative halves to graph
        for (let x = length; x >= 0; x -= 10) {
            const w = (x < flareLength) ? maxWidth * sin((x / flareLength) * HALF_PI) : maxWidth;
            vertex(x, w * widthMultiplier);
        }
        endShape();
    }

    update(){
        const now = millis();

        // Get current mouse state from p5.js
        const isMouseCurrentlyPressed = typeof window !== 'undefined' && 
                                      typeof window.mouseIsPressed !== 'undefined' ? 
                                      window.mouseIsPressed : false;


        if(this.wasMousePressed && !isMouseCurrentlyPressed && this.isCharging){
            //Unleash the beast when released
            soundManager.play("finalFlash");
            this.fire();
        }
        this.wasMousePressed = isMouseCurrentlyPressed;

        if(this.isActive && !this.isBeamFading && (now - this.startTime > this.duration)){
            //Starts beam fading
            this.isBeamFading = true;
            this.beamFadeStartTime = now;
        }

        if(this.isBeamFading && now - this.beamFadeStartTime >= this.fadeDuration){
            //Resets everything
            this.isActive = false;
            this.isBeamFading = false;
            getQueen().movementSpeed = this.movementSpeed; //Restore movement speed
        }

        //Update target until released
        if(this.isCharging && typeof mouseX !== 'undefined' && typeof mouseY !== 'undefined'){
            this.targetX = mouseX;
            this.targetY = mouseY;
        }
    }
}

class Fireball extends Power{
    constructor(damage, x, y, name){
        super(damage, x, y, "strike", name);
    }
    activate(){

    }
    render(){
        
    }
}

class PowerManager{
    constructor(){
        this.runningPowers = [];
    }
    addPower(name, damage, x, y){
        this.canUse = true;
        if(queenAnt.isPowerUnlocked(name)){
            // For Final Flash, check if we have an existing charging instance
            if (name === "finalFlash"){
                for (const power of this.runningPowers) {
                    if (power.name_ === name && power.isCharging){
                        // If mouse is released (finalizing the charge), fire the beam
                        if (!mouseIsPressed) {
                            power.fire();
                            return;
                        }
                        return; // Still charging, do nothing
                    }
                }
            }

            const now = millis();
            // Don't add if another instance of the same power is active or still in cooldown
            for (const power of this.runningPowers) {
                if (power.name_ === name) {
                    const inDuration = power.isActive;
                    const inCooldown = (now - (power.lastStrike || 0)) < (power.cooldown || 0);
                    if (inDuration || inCooldown) {
                        this.canUse = false;
                        // Early exit: another power of this type is active or cooling down
                        return;
                    }
                }
            }

            // Create and attempt to activate the power. Only keep it if activation succeeds.
            let newPower = null;
            switch(name){
                case "lightning":
                    newPower = new Lightning(damage, x, y, name);
                    break;
                case "finalFlash":
                    newPower = new FinalFlash(damage, x, y, name);
                    getQueen().movementSpeed = 0;
                    break;
                case "fireball":
                    newPower = new Fireball(damage, x, y, name);
                    break;
            }
            if (newPower) {
                const activated = typeof newPower.activate === 'function' ? newPower.activate() : true;
                if (activated){
                    this.runningPowers.push(newPower);
                }
            }
        }
    }
    update(){
        for(const power of this.runningPowers){
            power.update();
        }
        // Keep powers that are still within their duration or are on cooldown
        this.runningPowers = this.runningPowers.filter(power => {
            const now = millis();
            const isInDuration = now - power.created < power.duration;
            const isInCooldown = now - power.lastStrike < power.cooldown;
            return isInDuration || isInCooldown;
        });
    }
    render(){
        for(const power of this.runningPowers){
            power.render();
        }
    }
}