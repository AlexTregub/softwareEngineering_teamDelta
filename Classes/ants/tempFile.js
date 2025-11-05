  _performCombatAttack() {
    // Safety check: Only attack if we're actually in combat state
    if (!this._stateMachine || !this._stateMachine.isInCombat() ) { return;}

    
    // Verify target is still alive and in enemy list
    if (this._combatTarget) {
      let targetStillValid = this._enemies.includes(this._combatTarget) && this._combatTarget.health > 0 && this._combatTarget.isActive !== false;
      if (targetStillValid) {
        const distance = this._calculateDistance(this, this._combatTarget);
        if (distance <= this._attackRange) {
          this._attackTarget(this._combatTarget);
          return true;
        }
      }
      // Target is no longer valid, clear it
      this._combatTarget = null;
    }
    
    // Find a new target if we don't have one
    if (!this._combatTarget) {
      let [nearestEnemy,shortestDistance] = this.nearestEntity(this._enemies);
      // Set new target
      if(nearestEnemy) {
        if(shortestDistance <= this._attackRange){
          this._combatTarget = nearestEnemy;
          this._attackTarget(this._combatTarget);
          return true;
        }
        else if(nearestEnemy && shortestDistance <= this.getController('combat')._detectionRadius){
          this.moveToLocation(nearestEnemy.posX, nearestEnemy.posY);
          return true;
        }
      }


    }
    return false;
  }
  
  _attackTarget(target) {
    if (target && typeof target.takeDamage === 'function' && target.health > 0) {
      let now = this.lastFrameTime/ 1000; // seconds
      if (now - this._lastAttackTime < this._attackCooldown) return;

      if(this.jobName == "Spitter" || this.jobName == "Queen"){ 
                this.soundAlarmAtHive(target);

        // this.executeRangeCombatBehavior(target);
      }
      else if(this.jobName == "Farmer" || this.jobName == "Builder"){
        this.soundAlarmAtHive(target);
      }
      else if(this.jobName == "Scout"){ 
        //this.executeCombatBehavior(target);
      }
      else{
        // Use strength stat from StatsContainer, fallback to basic damage
        const attackPower = this._stats?.strength?.statValue || this._damage;
        target.takeDamage(attackPower);
        
        // Show damage effect if available
        if (this._renderController && typeof this._renderController.showDamageNumber === 'function') {
          const enemyPos = target.getPosition();
          this._renderController.showDamageNumber(attackPower, [255, 100, 100]);
        }
        this._lastAttackTime = now;
        logNormal(`🗡️ Ant ${this._antIndex} (${this._faction}) attacked enemy ${target._antIndex || 'unknown'} for ${attackPower} damage`);
      }
    }
  }