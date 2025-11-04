class Boss extends QueenAnt {
    constructor() {
        let queenBase = new spawnQueen();
        super(queenBase);
        this._type = 'Spider';
        this._faction = 'enemy';

        this.assignJob('Spider',JobImages['Spider']);
        this.attackRange = 20;
        this.detectionRange = 100;
        this.setSize(50,50);
        ants.splice(ants.indexOf(queenBase), 1); 
        ants.push(this);
        this.currentTarget = null;
        this._gatherState = null;
        this._movementController._skitterRange = 100;
    }

    nearestAnt(){
        let nearest = null;
        let minDist = Infinity;
        for (let ant of ants) {
        if (ant._faction === this._faction || ant === this) {
            continue;
        }

        let d = dist(this.posX, this.posY, ant.posX, ant.posY);
        if (d < minDist) {
            minDist = d;
            nearest = ant;
        }
        }
        return [nearest,minDist];
    }

    _updateResourceManager(){}



    rush(targetAnt){
        if(!targetAnt.isDead){
            this._attackTarget(this.currentTarget);
        }else{
            console.log(ants[targetAnt]);
        }
    }

    update() {
        super.update();
        let [nearestAnt, distance] = this.nearestAnt();
        if(!nearestAnt){ console.log(this._skitterRange); return;}

        if (this.currentTarget == null) {
            this.currentTarget = nearestAnt;
        }
        if(distance < this.attackRange){
           this.rush(this.currentTarget);
        }
        else {
            this.moveToLocation(this.currentTarget.posX, this.currentTarget.posY);
        }
    }
}