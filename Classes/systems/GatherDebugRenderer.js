// @ts-nocheck
/**
 * @fileoverview GatherDebugRenderer - Visualization utility for ant gathering behavior
 * Shows ant detection ranges, resource positions, and debugging information
 * 
 * @author Software Engineering Team Delta - Debug Utility
 * @version 1.0.0
 */

/**
 * Debug renderer for visualizing ant gathering behavior
 * Shows detection radii, resource positions, and search areas
 */
class GatherDebugRenderer {
  constructor() {
    this.enabled = false;
    this.showRanges = true;
    this.showResourceInfo = true;
    this.showDistances = true;
    this.showAntInfo = true;
    this.showAllLines = false;
    
    // Visual styling
    this.rangeColor = [255, 255, 0, 15]; // Yellow with transparency
    this.rangeStrokeColor = [255, 255, 0, 150];
    this.resourceColor = [0, 255, 0]; // Green
    this.antColor = [255, 0, 0]; // Red
    this.textColor = [255, 255, 255]; // White
    this.lineColor = [255, 255, 255, 100]; // White with transparency
  }

  /**
   * Toggle debug visualization on/off
   */
  toggle() {
    this.enabled = !this.enabled;
    console.log(`🔍 Gather Debug Renderer: ${this.enabled ? 'ENABLED' : 'DISABLED'}`);
  }

    /**
   * Toggles whether to show all lines or just the lines that are in range of resources
   */
  toggleAllLines() {
    this.showAllLines = !this.showAllLines;
  }

  /**
   * Enable debug visualization
   */
  enable() {
    this.enabled = true;
    console.log('🔍 Gather Debug Renderer: ENABLED');
  }

  /**
   * Disable debug visualization
   */
  disable() {
    this.enabled = false;
    console.log('🔍 Gather Debug Renderer: DISABLED');
  }

  /**
   * Render debug information for all gathering ants
   */
  render() {
    if (!this.enabled) return;

    // Check if we have ants and resources
    if (typeof ants === 'undefined' || !ants || ants.length === 0) return;
    if (typeof g_resourceManager === 'undefined' || !g_resourceManager) return;

    const resources = g_resourceManager.getResourceList();
    
    push(); // Save current drawing state
    
    // Render for each ant
    ants.forEach((ant, antIndex) => {
      if (ant.state === 'GATHERING' || ant._gatherState) {
        this.renderAntGatherInfo(ant, antIndex, resources);
      }
    });
    
    // Render resource information
    if (this.showResourceInfo) {
      renderResourceInfo(resources,this.textColor,this.resourceColor);
    }
    
    pop(); // Restore drawing state
  }

  /**
   * Render gathering information for a specific ant
   * @param {Object} ant - The ant object
   * @param {number} antIndex - Index of the ant
   * @param {Array} resources - Array of all resources
   */
  renderAntGatherInfo(ant, antIndex, resources) {
    const antPos = ant.getPosition();
    const gatherRadius = 224; // 7 tiles * 32px
    
    // Draw ant position
    if (this.showAntInfo) {
      fill(...this.antColor);
      noStroke();
      ellipse(antPos.x, antPos.y, 8, 8);
      
      // Ant label
      fill(...this.textColor);
      textAlign(CENTER, BOTTOM);
      textSize(12);
      text(`Ant ${antIndex}`, antPos.x, antPos.y - 10);
      text(`(${antPos.x.toFixed(0)}, ${antPos.y.toFixed(0)})`, antPos.x, antPos.y - 22);
    }
    
    // Draw gathering range circle
    if (this.showRanges) {
      // Fill circle
      fill(...this.rangeColor);
      stroke(...this.rangeStrokeColor);
      strokeWeight(2);
      ellipse(antPos.x, antPos.y, gatherRadius * 2, gatherRadius * 2);
      
      // Range label
      fill(...this.textColor);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(10);
      text(`${gatherRadius}px\n(7 tiles)`, antPos.x, antPos.y + gatherRadius - 20);
    }
    
    // Show distances to resources
    if (this.showDistances && resources.length > 0) {
      resources.forEach((resource, resIndex) => {
        const resPos = resource.getPosition();
        const distance = Math.sqrt((antPos.x - resPos.x) ** 2 + (antPos.y - resPos.y) ** 2);
        const isInRange = distance <= gatherRadius;

        if (isInRange || this.showAllLines){        
            // Distance label (midpoint of line)
            const midX = (antPos.x + resPos.x) / 2;
            const midY = (antPos.y + resPos.y) / 2;

            noStroke();
            textAlign(CENTER, CENTER);
            textSize(8);
            if (isInRange){
                drawTextBetweenTwoObjects(antPos,resPos,[200,255,200,255],'✓ IN RANGE',distance.toFixed(0),"px")
                drawLineBetweenEntities(antPos,resPos,"Green",1);
            } else {
                drawTextBetweenTwoObjects(antPos,resPos,[255,0,0,125],'✖ IN RANGE',distance.toFixed(0),"px")
                drawLineBetweenEntities(antPos,resPos,[255,255,255,30],1);
            }
            
        }
      });
    }
  }
}

function drawTextBetweenTwoObjects(objPos1, objPos2, textColor, textToPrint, distance = null, distanceUnits = null){
    const midX = (objPos1.x + objPos2.x) / 2;
    const midY = (objPos1.y + objPos2.y) / 2;

    push();
    fill(textColor);
    if (distance != null && distanceUnits != null) {
        text(`${distance}${distanceUnits}`, midX, midY)
    };
    text(textToPrint, midX, midY + 12);
    pop();
}

// Create global instance
if (typeof window !== 'undefined') {
  window.g_gatherDebugRenderer = new GatherDebugRenderer();
} else if (typeof global !== 'undefined') {
  global.g_gatherDebugRenderer = new GatherDebugRenderer();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GatherDebugRenderer;
}

/**
 * Global utility function to draw lines between entities
 * @param {Object} obj1Pos - Position of first entity {x, y}
 * @param {Object} obj2Pos - Position of second entity {x, y}
 * @param {Array} lineColor - RGB or RGBA color array [r, g, b] or [r, g, b, a]
 * @param {number} lineWeight - Thickness of the line
 */
function drawLineBetweenEntities(obj1Pos, obj2Pos, lineColor, lineWeight) {
  stroke(lineColor);
  strokeWeight(lineWeight);
  line(obj1Pos.x, obj1Pos.y, obj2Pos.x, obj2Pos.y);
}

  /**
   * Render information about all resources (debug overlay)
   * @param {Array} resources - Array of resource objects that implement getPosition() and resourceType
   * @param {Array} [textColor=this.textColor] - Optional text color array [r,g,b] or [r,g,b,a]
   * @param {Array} [resourceColor=this.resourceColor] - Optional resource dot color array
   */
function renderResourceInfo(resources,textColor,resourceColor) {
    if(typeof resources === "undefined" || typeof textColor === "undefined" || typeof resourceColor === "undefined"){
        if (typeof resources === "undefined") { IncorrectParamPassed([],resources )};
        if (typeof textColor === "undefined") { IncorrectParamPassed([],textColor )};
        if (typeof resourceColor === "undefined") { IncorrectParamPassed([],resourceColor )};
        return;
    }
    resources.forEach((resource, index) => {
        const resPos = resource.getPosition();
        
        // Draw resource position
        fill(resourceColor);
        noStroke();
        ellipse(resPos.x, resPos.y, 6, 6);
        
        // Resource label
        fill(textColor);
        textAlign(CENTER, BOTTOM);
        textSize(10);
        text(`${resource.resourceType || 'Resource'}`, resPos.x, resPos.y - 8);
        text(`(${resPos.x.toFixed(0)}, ${resPos.y.toFixed(0)})`, resPos.x, resPos.y - 18);
    });

    // Resource count in corner
    fill(textColor);
    textAlign(LEFT, TOP);
    textSize(14);
    text(`📦 Resources: ${resources.length}`, 10, 10);

    if (typeof ants !== 'undefined' && ants.length > 0) {
        const gatheringAnts = ants.filter(ant => ant.state === 'GATHERING');
        text(`🐜 Gathering Ants: ${gatheringAnts.length}/${ants.length}`, 10, 30);
    }
}


/**
 * Create resources near a specific ant for testing
 * @param {Object} ant - The ant to create resources near
 * @param {number} count - Number of resources to create
 */
function createTestResourcesNearAnt(ant, count = 3) {
    if (typeof g_resourceManager === 'undefined' || !g_resourceManager) {
      console.error('❌ g_resourceManager not available');
      return;
    }
    
    const antPos = ant.getPosition();
    const radius = 100; // Create within 100px of ant
    
    console.log(`Creating ${count} test resources near ant at (${antPos.x.toFixed(0)}, ${antPos.y.toFixed(0)})`);
    
    for (let i = 0; i < count; i++) {
      // Random position within radius
      const angle = (Math.PI * 2 * i) / count; // Distribute evenly in circle
      const distance = 50 + (Math.random() * 50); // 50-100px from ant
      
      const x = antPos.x + Math.cos(angle) * distance;
      const y = antPos.y + Math.sin(angle) * distance;
      
      // Create different types of resources
      let resource;
      switch (i % 3) {
        case 0:
          resource = Resource.createStick(x, y);
          break;
        case 1:
          resource = Resource.createGreenLeaf(x, y);
          break;
        case 2:
          resource = Resource.createMapleLeaf(x, y);
          break;
      }
      
      g_resourceManager.addResource(resource);
      console.log(`  ✅ Created ${resource.resourceType} at (${x.toFixed(0)}, ${y.toFixed(0)})`);
    }
    
    console.log(`total resources now: ${g_resourceManager.getResourceList().length}`);
  }