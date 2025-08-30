class entity extends stats{

    constructor(x,y,size){
        this.x = x;
        this.y = y;
        this.size = size;
    };
}

class stats{
    stat_hp; //Current Health Points
    stat_max_hp; //Max hp a entity can have, not accounting for buffs
    stat_temp_hp; //temp hp that is added on top of current hp and is not constrained by max HP
    stat_exp; //EXP this enitiy has gathered
    stat_speed; //Speed Entity moves at
    stat_ap; //Attack power

    'HP STATE ENUMS'
    HP_ALIVE = 2;
    HP_DEAD = 1;
    HP_MAX_HEALTH = 0;

    setHP(value){
        CheckHPState(value)
    }
    CheckHPState(value){
        if (value + this.stat_hp > this.stat_max_hp){
            return HP_MAX_HEALTH
        } else if (value + this.stat_hp <= 0) {
            return HP_DEAD
        } else {
            return HP_ALIVE
        }
    }
}