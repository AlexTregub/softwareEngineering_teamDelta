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
        if (now - this.lastStrike < this.cooldown) {
            const timeLeft = ((this.cooldown - (now - this.lastStrike)) / 1000);
            return false;
        }
        
        this.lastStrike = now;
        this.created = now;
        this.isActive = true;
        
        // Apply damage to nearby ants
        if (typeof ants !== 'undefined' && Array.isArray(ants)) {
            const aoeRadius = TILE_SIZE * this.radius;
            for (const ant of ants) {
                if (!ant || !ant.isActive) continue;
                // Skip the queen
                if (ant.jobName === 'Queen' || ant.job === 'Queen') continue;
                
                const antPos = ant.getPosition ? ant.getPosition() : { x: ant.x || 0, y: ant.y || 0 };
                const distance = Math.hypot(antPos.x - this.x_, antPos.y - this.y_);
                
                if (distance <= aoeRadius) {
                    if (typeof ant.takeDamage === 'function') {
                        ant.takeDamage(this.damage);
                    }
                }
            }
        }
        
        // Play strike sound
        if (typeof soundManager !== 'undefined') {
            soundManager.play('lightningStrike');
        }
        
        return true;
    }
    
    render(){
        const t = (millis() - this.created) / this.duration;

        let screenX = this.x_;
        let screenY = this.y_;

        if (typeof g_activeMap !== 'undefined' && g_activeMap && g_activeMap.renderConversion && typeof TILE_SIZE !== 'undefined') {
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
        
        if (this.isActive && now - this.created >= this.duration){
            this.isActive = false;
        }
        
        if (this.isActive){
            //Update visual effects (Not added yet)
        }
    }
}

class FinalFlash extends Power{
    constructor(damage, x, y, name){
        super(damage, x, y, "beam", name);
        this.width = 0.01; //Width of the beam
        this.cooldown = 1000; // 3 second cooldown
        this.power = 1;
        this.duration = 100;
        this.lastStrike = 0;
        this.isActive = false;
        this.isMousePressedFlag = false;
    }
    activate(){

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