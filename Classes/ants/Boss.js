class Boss extends QueenAnt {
    constructor() {
        let queenBase = new spawnQueen();
        super(queenBase);
        this._type = 'Boss';
        this._faction = 'enemy';

        this.assignJob('Boss');
        this.attackRange = 20;
        this.setSize(50,50);
        ants.splice(ants.indexOf(queenBase), 1); 

        ants.push(this);
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

    _updateResourceManager(){
        return;
    }


    rush(targetAnt){
        this.attack(targetAnt);
    }

    update(){
        super.update();
        let [nearestAnt, distance] = this.nearestAnt();
        if (nearestAnt) {
            if(distance <= this.attackRange){
                this.rush(nearestAnt);
            }
            else{
                this.moveToLocation(nearestAnt.posX, nearestAnt.posY);
            }
        }
    }
}