//All the power brushes in one nice place

class PowerBrush{
    constructor(range = 7, name){
        this.range_ = range; //Tiles from queen
        this.pixelRange_ = this.range_ * TILE_SIZE;
        this.name_ = name;
    }
    attemptStrike(mouseX, mouseY){}
    checkInRange(mouseX, mouseY){
        const dx = (mouseX - getQueen().getScreenPosition().x);
        const dy = (mouseY - getQueen().getScreenPosition().y);
        const dist = Math.hypot(dx, dy);
        console.log(`Distance from queen: ${dist}, allowed range: ${this.pixelRange_}`);
        return dist <= this.pixelRange_;
    }
    render(queenScreenX, queenScreenY){}
    update(){}
}
class LightningBrush extends PowerBrush{
    constructor(){
        super(7, "lightning");
        this.damage = 30;
    }
    attemptStrike(mouseX, mouseY){
        return(super.checkInRange(mouseX, mouseY));
    }
    render(queenScreenX, queenScreenY){
        push();
        noFill();
        stroke(100, 0, 255, 140);
        strokeWeight(2);
        ellipse(queenScreenX, queenScreenY, this.pixelRange_ * 2, this.pixelRange_ * 2);
        pop();
    }
    update(){
        this.render(getQueen().getScreenPosition().x, getQueen().getScreenPosition().y);
    }
    
}

class FinalFlashBrush extends PowerBrush{
    constructor(){
        super(15, "finalFlash");
        this.damage = 500;
    }
    attemptStrike(mouseX, mouseY){
        return super.checkInRange(mouseX, mouseY);
    }
    render(queenScreenX, queenScreenY){
        push();
        noFill();
        stroke(255, 255, 25, 300);
        strokeWeight(2);
        ellipse(queenScreenX, queenScreenY, this.pixelRange_ * 2, this.pixelRange_ * 2);
        pop();
    }
    update(){
        this.render(getQueen().getScreenPosition().x, getQueen().getScreenPosition().y);
    }
}
class FireballBrush extends PowerBrush{
    constructor(){
        super(10, "fireball");
        this.damage = 50;
    }
    attemptStrike(mouseX, mouseY){
        if(this.checkInRange(mouseX, mouseY)){
            console.log(`in range`);
            this.powers.addPower("fireball", this.damage, mouseX, mouseY);
        }
    }
    render(queenScreenX, queenScreenY){
        push();
        noFill();
        stroke(255, 0, 12, 140);
        strokeWeight(2);
        ellipse(queenScreenX, queenScreenY, this.pixelRange_ * 2, this.pixelRange_ * 2);
        pop();
    }
}

class PowerBrushManager{
    constructor(){
        this.powers = new PowerManager();
        this.powerBrushes = {
            "lightning" : new LightningBrush(),
            "finalFlash" : new FinalFlashBrush(),
            "fireball" : new FireballBrush()
        };
        this.currentBrush = null;
    }
    switchPower(keyPressed){
        switch(keyPressed){
            case '3':
                if(this.currentBrush == this.powerBrushes["lightning"]){
                    this.currentBrush = null;
                }
                else this.currentBrush = this.powerBrushes["lightning"];
                break;
            case '4':
                if(this.currentBrush == this.powerBrushes["finalFlash"]){
                    this.currentBrush = null;
                }
                else this.currentBrush = this.powerBrushes["finalFlash"];
                break;
            case '5':
                if(this.currentBrush == this.powerBrushes["fireball"]){
                    this.currentBrush = null;
                }
                else this.currentBrush = this.powerBrushes["fireball"];
                break;
        }
    }
    render(){
        const queen = typeof getQueen === 'function' ? getQueen() : null;
        this.queenScreenX = 0;
        this.queenScreenY = 0;
        if (queen) {
            if(typeof queen.getScreenPosition === 'function'){
                // Use Entity's getScreenPosition for proper coordinate conversion
                const screenPos = queen.getScreenPosition();
                this.queenScreenX = screenPos.x;
                this.queenScreenY = screenPos.y;
            }
            else{
                // Fallback for non-Entity objects
                this.queenScreenX = queen.x || 0;
                this.queenScreenY = queen.y || 0;
            }
        }
        if(queen && this.currentBrush != null){
            this.currentBrush.render(this.queenScreenX, this.queenScreenY);
            this.powers.render();
            console.log("Rendering power brush");
        }
    }
    usePower(mouseX, mouseY){
        console.log("Using power brush: " + this.currentBrush.name_);
        if(this.currentBrush.attemptStrike(mouseX, mouseY)){
            this.powers.addPower(this.currentBrush.name_, this.currentBrush.damage, mouseX, mouseY);
        }
    }
    update(){
        this.powers.update();
        if (this.currentBrush != null && getQueen() != null){
            this.currentBrush.update();
        }
    }
    
    /**
     * updateAllBrushes
     * ----------------
     * Centralized update for all brush systems
     * Called from draw() loop to update all active brushes
     */
    updateAllBrushes() {
        if (window.g_enemyAntBrush) window.g_enemyAntBrush.update();
        if (window.g_lightningAimBrush) window.g_lightningAimBrush.update();
        if (window.g_resourceBrush) window.g_resourceBrush.update();
        if (window.g_buildingBrush) window.g_buildingBrush.update();
        if (window.g_flashAimBrush) window.g_flashAimBrush.update();
        this.update(); // Update power brushes
    }
}