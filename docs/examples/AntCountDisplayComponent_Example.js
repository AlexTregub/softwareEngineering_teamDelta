/**
 * Example Integration for AntCountDisplayComponent
 * 
 * This file shows how to integrate the ant population display
 * into your sketch.js. Copy the relevant sections to your sketch.js.
 */

// ============================================================
// STEP 1: Add global variable (top of sketch.js)
// ============================================================

let g_antCountDisplay; // Add this with your other global UI variables

// ============================================================
// STEP 2: Initialize in setup() function
// ============================================================

function setup() {
  // ... your existing setup code ...
  
  // Initialize ant count display (place after RenderManager.initialize())
  if (typeof AntCountDisplayComponent !== 'undefined') {
    g_antCountDisplay = new AntCountDisplayComponent(20, 80, {
      sprites: {} // Auto-loads from JobImages global
    });
    
    console.log('✅ AntCountDisplayComponent initialized');
    
    // Register with RenderManager
    if (typeof RenderManager !== 'undefined') {
      // Update drawable - queries ants array
      RenderManager.addDrawableToLayer(RenderManager.layers.UI_GAME, () => {
        if (g_antCountDisplay && GameState.getState() === 'PLAYING') {
          g_antCountDisplay.update();
        }
      });
      
      // Render drawable - draws the panel
      RenderManager.addDrawableToLayer(RenderManager.layers.UI_GAME, () => {
        if (g_antCountDisplay && GameState.getState() === 'PLAYING') {
          g_antCountDisplay.render('PLAYING');
        }
      });
      
      // Interactive handler - handles clicks
      RenderManager.addInteractiveDrawable(RenderManager.layers.UI_GAME, {
        hitTest: (pointer) => {
          if (!g_antCountDisplay || GameState.getState() !== 'PLAYING') return false;
          return g_antCountDisplay.isMouseOver(pointer.x, pointer.y);
        },
        onPointerDown: (pointer) => {
          if (!g_antCountDisplay || GameState.getState() !== 'PLAYING') return false;
          return g_antCountDisplay.handleClick(pointer.x, pointer.y);
        }
      });
      
      console.log('✅ AntCountDisplayComponent registered with RenderManager');
    }
  } else {
    console.warn('⚠️ AntCountDisplayComponent not loaded');
  }
}

// ============================================================
// STEP 3: Add to index.html (in script loading section)
// ============================================================

/*
Add this line to your index.html where UI components are loaded:

<script src="Classes/ui/AntCountDisplayComponent.js"></script>

For example, after other UI components:

  <!-- UI Components -->
  <script src="Classes/ui/ToolBar.js"></script>
  <script src="Classes/ui/MaterialPalette.js"></script>
  <script src="Classes/ui/AntCountDisplayComponent.js"></script>
*/

// ============================================================
// ALTERNATIVE: Simple Integration (without RenderManager)
// ============================================================

/*
If you prefer simpler integration without using RenderManager,
add this to your draw() function:

function draw() {
  // ... other drawing code ...
  
  // Update and render ant count display
  if (GameState.getState() === 'PLAYING' && g_antCountDisplay) {
    g_antCountDisplay.update();
    g_antCountDisplay.render('PLAYING');
  }
}

And add this to your mousePressed() function:

function mousePressed() {
  // ... other mouse handling ...
  
  // Handle ant count display clicks
  if (GameState.getState() === 'PLAYING' && g_antCountDisplay) {
    const handled = g_antCountDisplay.handleClick(mouseX, mouseY);
    if (handled) return; // Panel consumed the click
  }
  
  // ... rest of mouse handling ...
}
*/

// ============================================================
// OPTIONAL: Customization Examples
// ============================================================

/*
// Change position
g_antCountDisplay.setPosition(100, 20);

// Update max ant capacity
g_antCountDisplay.maxAnts = 100;

// Force expand/collapse
g_antCountDisplay.setExpanded(true);

// Custom styling
g_antCountDisplay.panelWidth = 200;
g_antCountDisplay.backgroundColor = [50, 50, 50];
g_antCountDisplay.backgroundAlpha = 180;

// Manual count updates (if not using auto-querying)
g_antCountDisplay.updateTotal(45, 100);
g_antCountDisplay.updateTypeCount('Scout', 10);
g_antCountDisplay.updateTypeCount('Builder', 5);
*/

// ============================================================
// TESTING THE COMPONENT
// ============================================================

/*
To test that the component is working:

1. Start the game: npm run dev
2. Open browser console (F12)
3. Check for initialization message: "✅ AntCountDisplayComponent initialized"
4. Create some ants (spawn them in your game)
5. Look for the panel in the top-left corner showing ant counts
6. Click the panel to expand/collapse the breakdown
7. Verify counts update in real-time as ants spawn/die
*/

// ============================================================
// DEBUGGING
// ============================================================

/*
If the panel isn't showing:

// Check if component is loaded
console.log('Component loaded:', typeof AntCountDisplayComponent !== 'undefined');

// Check if instance exists
console.log('Instance exists:', g_antCountDisplay !== null);

// Check if ants array has data
console.log('Ants count:', ants.length);
console.log('Player ants:', ants.filter(a => a._faction === 'player').length);

// Check game state
console.log('Game state:', GameState.getState());

// Force render to test
if (g_antCountDisplay) {
  g_antCountDisplay.update();
  g_antCountDisplay.render('PLAYING');
}

// Check position
console.log('Display position:', g_antCountDisplay.x, g_antCountDisplay.y);
*/
