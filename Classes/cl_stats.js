// Basic stats class, designed to be able to handle buffs, debuffs

class stats extends canvasObject {
    // Current Health Points
    stat_hp; 

    // Max hp a entity can have, not accounting for buffs
    stat_max_hp; 

    // temp hp that is added on top of current hp and is not constrained by max HP
    stat_temp_hp; 

    // EXP this enitiy has gathered
    stat_exp; 

    // Speed Entity moves at
    stat_speed; 

    // Attack power
    stat_ap; 

    HP_ENUMS = {
      HP_ALIVE: 2,
      HP_DEAD: 1,
      HP_MAX_HEALTH: 0
    }

    setHP(value) {
        CheckHPState(value)
    }

    CheckHPState(value) {
        if (value + this.stat_hp > this.stat_max_hp){
            return HP_ENUMS.HP_MAX_HEALTH
        } else if (value + this.stat_hp <= 0) {
            return HP_ENUMS.HP_DEAD
        } else {
            return HP_ENUMS.HP_ALIVE
        }
    }

    PrintHPEnums(){
    }
}