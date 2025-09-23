// PRACTICAL IMPLEMENTATION GUIDE
// How to integrate faction system with existing ant state machine

console.log("🛠️ FACTION INTEGRATION IMPLEMENTATION GUIDE");
console.log("============================================\n");

// STEP 1: MODIFY AntStateMachine.js
console.log("📝 STEP 1: MODIFY AntStateMachine.js");
console.log("===================================");

const antStateMachineModifications = {
  "File": "Classes/ants/antStateMachine.js",
  "Changes Required": [
    {
      "Location": "Constructor",
      "Change": "Add reference to ant instance",
      "Code": `
      // ADD THIS TO CONSTRUCTOR:
      constructor(ant) {
        // Existing code...
        this._ant = ant; // NEW: Reference to ant that owns this state machine
      }`
    },
    {
      "Location": "canPerformAction method",
      "Change": "Add faction awareness",
      "Code": `
      // MODIFY EXISTING canPerformAction METHOD:
      canPerformAction(action, targetAnt = null) {
        // Existing state-based checks
        if (this._primaryState === "DEAD") return false;
        // ... other existing checks ...
        
        // NEW: Faction-based checks
        if (targetAnt && this._ant && this._ant.faction && targetAnt.faction) {
          return this._checkFactionPermission(action, targetAnt);
        }
        
        return true; // Original return logic
      }`
    },
    {
      "Location": "New method",
      "Change": "Add faction permission checking",
      "Code": `
      // ADD NEW METHOD:
      _checkFactionPermission(action, targetAnt) {
        const relationship = this._ant.faction.getRelationshipState(targetAnt.faction.name);
        
        switch (action) {
          case "attack":
            return relationship.name === "ENEMIES" || relationship.name === "BLOOD_ENEMIES";
          case "socialize":
          case "trade":
            return relationship.name === "NEUTRAL" || relationship.name === "ALLIED";
          case "follow":
            return relationship.name === "ALLIED" || this._ant.faction === targetAnt.faction;
          default:
            return true;
        }
      }`
    },
    {
      "Location": "New method",
      "Change": "Add automatic faction behavior checking",
      "Code": `
      // ADD NEW METHOD:
      checkAutomaticFactionBehaviors(nearbyAnts) {
        if (!this._ant || !this._ant.faction) return;
        
        nearbyAnts.forEach(otherAnt => {
          if (!otherAnt.faction || otherAnt === this._ant) return;
          
          const relationship = this._ant.faction.getRelationshipState(otherAnt.faction.name);
          
          // Auto-attack enemies on sight
          if (relationship.attackOnSight && this._combatModifier === "OUT_OF_COMBAT") {
            this.setCombatModifier("IN_COMBAT");
            this._ant.faction.modifyRelationship(otherAnt.faction.name, -2, "Auto-combat");
          }
          
          // Auto-assist allies in combat
          if (relationship.name === "ALLIED" && otherAnt.stateMachine.isInCombat()) {
            this.setPrimaryState("FOLLOWING");
          }
        });
      }`
    }
  ]
};

console.log(JSON.stringify(antStateMachineModifications, null, 2));

// STEP 2: MODIFY ants.js
console.log("\\n📝 STEP 2: MODIFY ants.js");
console.log("=========================");

const antsJsModifications = {
  "File": "Classes/ants/ants.js",
  "Changes Required": [
    {
      "Location": "Constructor",
      "Change": "Update state machine initialization",
      "Code": `
      // MODIFY STATE MACHINE INITIALIZATION:
      // Change from: this._stateMachine = new AntStateMachine();
      // To:
      this._stateMachine = new AntStateMachine(this);`
    },
    {
      "Location": "setFaction method",
      "Change": "Enhanced faction setting with notifications",
      "Code": `
      // ENHANCE EXISTING setFaction METHOD:
      setFaction(faction) {
        const oldFaction = this._faction;
        this._faction = faction;
        
        // Notify faction system of ant joining
        if (faction && faction !== oldFaction) {
          faction.addAnt(this);
          console.log(\`Ant joined \${faction.name} faction\`);
        }
        
        // Remove from old faction
        if (oldFaction && oldFaction !== faction) {
          oldFaction.removeAnt(this);
        }
      }`
    },
    {
      "Location": "update method",
      "Change": "Add faction behavior checking",
      "Code": `
      // ADD TO EXISTING update() METHOD:
      update() {
        // Existing update logic...
        
        // NEW: Check for automatic faction behaviors
        if (this._faction && this._stateMachine) {
          const nearbyAnts = this.getNearbyAnts(100); // Within 100 pixel radius
          this._stateMachine.checkAutomaticFactionBehaviors(nearbyAnts);
        }
        
        // Rest of existing update logic...
      }`
    },
    {
      "Location": "encounterAnt method",
      "Change": "Add faction-aware encounter logic",
      "Code": `
      // ADD NEW METHOD OR ENHANCE EXISTING:
      encounterAnt(otherAnt) {
        if (!otherAnt || !otherAnt.faction || !this._faction) return;
        
        // Factions learn about each other
        this._faction.encounterFaction(otherAnt.faction);
        otherAnt.faction.encounterFaction(this._faction);
        
        // Check if automatic behaviors should trigger
        this._stateMachine.checkAutomaticFactionBehaviors([otherAnt]);
        
        return this._faction.getRelationshipState(otherAnt.faction.name);
      }`
    },
    {
      "Location": "getNearbyAnts method",
      "Change": "Add or enhance existing method",
      "Code": `
      // ADD IF DOESN'T EXIST:
      getNearbyAnts(radius = 50) {
        // This would integrate with your existing ant detection system
        // Return array of ants within specified radius
        return []; // Implement based on your existing ant management
      }`
    }
  ]
};

console.log(JSON.stringify(antsJsModifications, null, 2));

// STEP 3: ENHANCE faction.js
console.log("\\n📝 STEP 3: ENHANCE faction.js");
console.log("=============================");

const factionJsEnhancements = {
  "File": "Classes/ants/faction.js",
  "Additions Required": [
    {
      "Location": "Faction class",
      "Change": "Add ant management",
      "Code": `
      // ADD TO FACTION CLASS:
      constructor(name, color) {
        // Existing constructor code...
        this.ants = new Set(); // Track ants in this faction
      }
      
      addAnt(ant) {
        this.ants.add(ant);
        console.log(\`\${ant.constructor.name} joined \${this.name} faction (\${this.ants.size} total)\`);
      }
      
      removeAnt(ant) {
        this.ants.delete(ant);
        console.log(\`\${ant.constructor.name} left \${this.name} faction (\${this.ants.size} remaining)\`);
      }
      
      getAntCount() {
        return this.ants.size;
      }
      
      getAllAnts() {
        return Array.from(this.ants);
      }`
    },
    {
      "Location": "Faction class",
      "Change": "Add encounter-based relationship changes",
      "Code": `
      // ADD TO FACTION CLASS:
      encounterFaction(otherFaction) {
        if (otherFaction === this) return;
        
        // First encounter - establish relationship
        if (!this.relationships.has(otherFaction.name)) {
          this.relationships.set(otherFaction.name, 50); // Neutral starting point
          console.log(\`\${this.name} discovers \${otherFaction.name} faction\`);
        }
        
        // Update last contact time
        this.lastContact = this.lastContact || new Map();
        this.lastContact.set(otherFaction.name, Date.now());
      }
      
      modifyRelationship(factionName, change, reason = "Unknown") {
        const current = this.relationships.get(factionName) || 50;
        const newValue = Math.max(0, Math.min(100, current + change));
        this.relationships.set(factionName, newValue);
        
        const oldState = this.getRelationshipState(factionName, current);
        const newState = this.getRelationshipState(factionName);
        
        if (oldState.name !== newState.name) {
          console.log(\`\${this.name} -> \${factionName}: \${oldState.name} -> \${newState.name} (\${reason})\`);
          this.onRelationshipChange(factionName, oldState, newState, reason);
        }
      }
      
      onRelationshipChange(factionName, oldState, newState, reason) {
        // Notify all ants in faction of relationship change
        this.ants.forEach(ant => {
          if (ant.onFactionRelationshipChange) {
            ant.onFactionRelationshipChange(factionName, oldState, newState, reason);
          }
        });
      }`
    }
  ]
};

console.log(JSON.stringify(factionJsEnhancements, null, 2));

// STEP 4: IMPLEMENTATION ORDER
console.log("\\n🚀 IMPLEMENTATION ORDER:");
console.log("========================");

const implementationOrder = [
  {
    "Step": 1,
    "Task": "Backup existing files",
    "Commands": [
      "Copy-Item 'Classes/ants/antStateMachine.js' 'Classes/ants/antStateMachine.js.backup'",
      "Copy-Item 'Classes/ants/ants.js' 'Classes/ants/ants.js.backup'",
      "Copy-Item 'Classes/ants/faction.js' 'Classes/ants/faction.js.backup'"
    ]
  },
  {
    "Step": 2,
    "Task": "Modify AntStateMachine.js",
    "Details": "Add constructor parameter, enhance canPerformAction, add faction methods"
  },
  {
    "Step": 3,
    "Task": "Modify ants.js constructor",
    "Details": "Pass 'this' to AntStateMachine constructor"
  },
  {
    "Step": 4,
    "Task": "Test basic integration",
    "Details": "Ensure no existing functionality breaks"
  },
  {
    "Step": 5,
    "Task": "Add faction enhancements",
    "Details": "Add ant management and relationship change events to faction.js"
  },
  {
    "Step": 6,
    "Task": "Add encounter logic",
    "Details": "Implement faction-aware encounters in ants.js"
  },
  {
    "Step": 7,
    "Task": "Add automatic behaviors",
    "Details": "Implement auto-attack and auto-assist behaviors"
  },
  {
    "Step": 8,
    "Task": "Comprehensive testing",
    "Details": "Test all faction interactions and state machine integration"
  }
];

implementationOrder.forEach((step, index) => {
  console.log(`${step.Step}. ${step.Task}`);
  console.log(`   ${step.Details || ''}`);
  if (step.Commands) {
    step.Commands.forEach(cmd => console.log(`   > ${cmd}`));
  }
  console.log('');
});

// STEP 5: TESTING PLAN
console.log("🧪 TESTING PLAN:");
console.log("================");

const testingScenarios = [
  {
    "Scenario": "Basic Faction Assignment",
    "Test": "Create ant, assign faction, verify state machine has ant reference",
    "Expected": "No errors, faction properly set, state machine functional"
  },
  {
    "Scenario": "Faction-Aware Combat",
    "Test": "Enemy factions auto-attack, allied factions don't attack",
    "Expected": "Enemies trigger combat state, allies ignore each other"
  },
  {
    "Scenario": "Action Permissions",
    "Test": "Test canPerformAction with different faction relationships",
    "Expected": "Attack blocked for allies, trading blocked for enemies"
  },
  {
    "Scenario": "Relationship Changes",
    "Test": "Combat should worsen relationships, trade should improve them",
    "Expected": "Relationship values change appropriately with events"
  },
  {
    "Scenario": "State Transitions",
    "Test": "Faction events should trigger appropriate state changes",
    "Expected": "Combat -> IN_COMBAT, assistance -> FOLLOWING"
  }
];

testingScenarios.forEach((test, index) => {
  console.log(`${index + 1}. ${test.Scenario}`);
  console.log(`   Test: ${test.Test}`);
  console.log(`   Expected: ${test.Expected}\n`);
});

console.log("✅ IMPLEMENTATION GUIDE COMPLETE!");
console.log("\\n🎯 KEY INTEGRATION POINTS:");
console.log("- State machine gets ant reference for faction access");
console.log("- canPerformAction() enhanced with faction permission checks");
console.log("- Automatic behaviors triggered based on faction relationships");
console.log("- Faction system tracks ants and notifies of relationship changes");
console.log("- Existing functionality preserved while adding faction awareness");