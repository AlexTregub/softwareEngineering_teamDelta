# 🏗️ **RENDERING SYSTEM ARCHITECTURE PLAN**

**Version**: 1.0  
**Date**: October 2, 2025  
**Author**: David Willman

## 📋 **OVERVIEW**

This document outlines the complete rendering system hierarchy designed to provide:
- **Centralized safety checks** (startup-only via FunctionAsserts.js)
- **Clear separation of responsibilities** (no overlapping logic)
- **Comprehensive performance monitoring** 
- **Simple user API** with powerful customization options

---

## 🏗️ **SYSTEM HIERARCHY**

```
┌─────────────────────────────────────────────────────────────────────┐
│                        GAME LOOP (sketch.js)                        │
│                    calls render() once per frame                    │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────────┐
│                   RenderLayerManager                                │ 
│  • Master coordinator - decides WHAT to render based on game state  │
│  • Calls layer renderers in correct order                          │
│  • Manages transitions between game states                          │
│  • NO entity logic - pure layer orchestration                      │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┬─────────────────┐
        │                 │                 │                 │
┌───────▼────┐    ┌───────▼────────┐    ┌──▼──────┐    ┌────▼─────┐
│  Terrain   │    │ EntityRenderer │    │ UI      │    │ Effects  │
│  Layer     │    │               │    │ Layer   │    │ Layer    │
└────────────┘    └───────┬────────┘    └─────────┘    └──────────┘
                          │
            ┌─────────────┼─────────────┐
            │             │             │
    ┌───────▼────┐ ┌──────▼──────┐ ┌───▼────────┐
    │ Resources  │ │    Ants     │ │ Buildings  │
    │ Group      │ │   Group     │ │ Group      │
    └──────┬─────┘ └──────┬──────┘ └───┬────────┘
           │              │            │
    ┌──────▼──────────────▼────────────▼──────┐
    │           RenderController              │
    │  • Per-entity rendering & effects       │
    │  • Highlights, animations, state        │
    │  • Uses Sprite2D for actual drawing     │
    └─────────────────┬───────────────────────┘
                      │
            ┌─────────▼─────────┐
            │     Sprite2D      │
            │  • Basic image    │
            │    rendering      │
            │  • Transforms     │
            │  • NO game logic  │
            └───────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    PerformanceMonitor                               │
│  • Centralized performance tracking for all systems                │
│  • Frame timing, layer times, entity counts                        │
│  • Renders debug overlay with all stats                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 **COMPONENT RESPONSIBILITIES**

### **1. RenderLayerManager** (Master Coordinator)
**File**: `RenderLayerManager.js`  
**Purpose**: Game state-based layer orchestration  

**Responsibilities**:
- Determines which layers to render based on game state (PLAYING, PAUSED, MENU, etc.)
- Calls layer renderers in correct z-order
- Manages state transitions and overlay rendering
- **REMOVED**: Entity collection, performance tracking, safety checks

**API**:
```javascript
RenderManager.render(gameState);
RenderManager.registerLayerRenderer(layerName, rendererFunction);
```

### **2. EntityRenderer** (Entity Collection & Management)
**File**: `EntityRenderer.js` (renamed from EntityLayerRenderer.js)  
**Purpose**: Collect, group, and coordinate entity rendering  

**Responsibilities**:
- Collects entities from global systems (`g_resourceList`, `ants[]`, `buildings[]`)
- Groups entities by type for efficient rendering
- Handles frustum culling and depth sorting
- Delegates individual entity rendering to RenderController
- **REMOVED**: Duplicate position/size accessors, redundant performance tracking

**Entity Groups**:
- `RESOURCES` - Collectible items (sticks, leaves, etc.)
- `ANTS` - All ant entities and colonies  
- `BUILDINGS` - Structures, anthills, etc.
- `PROJECTILES` - Arrows, attacks, etc.
- `ENVIRONMENTAL` - Trees, rocks, decorative objects

### **3. RenderController** (Per-Entity Effects & Rendering)
**File**: `RenderController.js`  
**Purpose**: Individual entity visual effects and state management  

**Responsibilities**:
- Attached to each entity instance
- Handles highlights, animations, visual effects
- Manages state indicators (MOVING, GATHERING, etc.)
- Coordinates with Sprite2D for actual drawing
- **REMOVED**: Position/size detection (standardized entity API), safety checks

**Effects System**:
- Highlights: Selected, hover, combat states
- Animations: Bob, pulse, rotation effects  
- Visual feedback: Damage numbers, floating text
- State indicators: Activity icons above entities

### **4. Sprite2D** (Pure Image Rendering)
**File**: `Sprite2D.js`  
**Purpose**: Simple, fast image rendering with transforms  

**Responsibilities**:
- Renders images with position, size, rotation, opacity
- Handles p5.js transformations (push/pop matrix operations)
- **REMOVED**: Safety checks, game logic, entity knowledge

**Features**:
- Center-based transformations
- Automatic vector conversion
- Opacity/tint support
- Minimal, reusable design

### **5. PerformanceMonitor** (Centralized Performance Tracking)
**File**: `PerformanceMonitor.js` (NEW)  
**Purpose**: Unified performance analysis and debug display  

**Responsibilities**:
- Tracks frame timing across all rendering systems
- Monitors entity counts, culling efficiency  
- Renders comprehensive debug overlay
- Provides performance APIs for all systems

---

## 🎨 **UI LAYER DETAILED PLAN**

### **UI Layer Architecture**
```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                             │
├─────────────────────────┬───────────────────────────────────┤
│    In-Game UI           │         Menu UI                   │
│                         │                                   │
│  ┌─────────────────┐    │    ┌─────────────────┐           │
│  │  HUD Elements   │    │    │  Main Menu      │           │
│  │  • Currency     │    │    │  • Play/Options │           │
│  │  • Minimap      │    │    │  • Credits      │           │
│  │  • Toolbar      │    │    │  • Exit         │           │
│  └─────────────────┘    │    └─────────────────┘           │
│                         │                                   │
│  ┌─────────────────┐    │    ┌─────────────────┐           │
│  │ Interaction UI  │    │    │  Pause Menu     │           │
│  │  • Selection    │    │    │  • Resume       │           │
│  │  • Context      │    │    │  • Settings     │           │
│  │  • Tooltips     │    │    │  • Main Menu    │           │
│  └─────────────────┘    │    └─────────────────┘           │
│                         │                                   │
│  ┌─────────────────┐    │    ┌─────────────────┐           │
│  │   Debug UI      │    │    │  Settings UI    │           │
│  │  • Performance │    │    │  • Graphics     │           │
│  │  • Entity Info  │    │    │  • Audio        │           │
│  │  • Console      │    │    │  • Controls     │           │
│  └─────────────────┘    │    └─────────────────┘           │
└─────────────────────────┴───────────────────────────────────┘
```

### **UI Components**

#### **HUD Elements**
- **Currency Display**: Wood, food, population counters
- **Minimap**: Small overview of game world  
- **Toolbar**: Action buttons, build menu
- **Resource Bar**: Current carrying capacity

#### **Interaction UI**
- **Selection Box**: Multi-entity selection rectangle
- **Context Menus**: Right-click actions for entities
- **Tooltips**: Hover information for entities/UI
- **Progress Bars**: Building/gathering progress

#### **Debug UI** (Development Only)
- **Performance Overlay**: FPS, render times, entity counts
- **Entity Inspector**: Selected entity details
- **Debug Console**: Command input and log output
- **Grid/Wireframe Toggles**: Visual debugging aids

#### **Menu Systems**
- **Main Menu**: Game start, options, credits
- **Pause Menu**: In-game menu overlay
- **Settings**: Graphics, audio, control configuration
- **Game Over**: Results and restart options

### **UI Rendering Order** (Bottom to Top)
1. **Background UI**: Semi-transparent overlays
2. **HUD Elements**: Always visible game info
3. **Interaction UI**: Selection, tooltips, context menus
4. **Modal Dialogs**: Settings, pause menus
5. **Debug Overlays**: Development information
6. **Cursor/Pointer**: Always on top

---

## ✨ **EFFECTS LAYER DETAILED PLAN**

### **Effects Layer Architecture**
```
┌─────────────────────────────────────────────────────────────┐
│                      Effects Layer                          │
├─────────────────┬───────────────────┬─────────────────────┤
│   Particle      │    Visual         │      Audio          │
│   Effects       │    Effects        │      Effects        │
│                 │                   │                     │
│ ┌─────────────┐ │ ┌───────────────┐ │ ┌─────────────────┐ │
│ │ Combat      │ │ │ Screen        │ │ │ 3D Positional   │ │
│ │ • Blood     │ │ │ • Transitions │ │ │ • Footsteps     │ │
│ │ • Sparks    │ │ │ • Fade in/out │ │ │ • Combat        │ │
│ │ • Impact    │ │ │ • Screen shake│ │ │ • Environment   │ │
│ └─────────────┘ │ └───────────────┘ │ └─────────────────┘ │
│                 │                   │                     │
│ ┌─────────────┐ │ ┌───────────────┐ │ ┌─────────────────┐ │
│ │ Environment │ │ │ Entity        │ │ │ UI Sounds       │ │
│ │ • Weather   │ │ │ • Highlights  │ │ │ • Clicks        │ │
│ │ • Dust      │ │ │ • Status      │ │ │ • Notifications │ │
│ │ • Wind      │ │ │ • Animations  │ │ │ • Alerts        │ │
│ └─────────────┘ │ └───────────────┘ │ └─────────────────┘ │
│                 │                   │                     │
│ ┌─────────────┐ │ ┌───────────────┐ │ ┌─────────────────┐ │
│ │ Interactive │ │ │ UI            │ │ │ Ambient         │ │
│ │ • Trails    │ │ │ • Notifications│ │ │ • Background    │ │
│ │ • Indicators│ │ │ • Damage nums │ │ │ • Nature        │ │
│ │ • Pathfind  │ │ │ • Tooltips    │ │ │ • Atmosphere    │ │
│ └─────────────┘ │ └───────────────┘ │ └─────────────────┘ │
└─────────────────┴───────────────────┴─────────────────────┘
```

### **Effect Categories**

#### **Particle Effects**
- **Combat Effects**: Blood splatters, impact sparks, weapon trails
- **Environmental Effects**: Dust clouds, falling leaves, weather particles  
- **Interactive Effects**: Selection indicators, movement trails, gathering sparkles
- **Magical Effects**: Spell casting, power-ups, special abilities

#### **Visual Effects** 
- **Screen Effects**: Transitions, fades, screen shake, flash effects
- **Entity Effects**: Highlighting, status indicators, animation overlays
- **UI Effects**: Button animations, notification pop-ups, progress visualizations
- **Lighting Effects**: Dynamic shadows, day/night cycles, torch flames

#### **Audio Effects**
- **3D Positional Audio**: Sounds positioned in world space with distance falloff
- **UI Audio**: Button clicks, menu sounds, notification chimes  
- **Ambient Audio**: Background nature sounds, wind, atmospheric tracks
- **Dynamic Audio**: Combat sounds, footsteps, tool usage with spatial positioning

### **Effect System Features**

#### **Lifecycle Management**
- **Automatic Cleanup**: Effects remove themselves when expired
- **Pooling System**: Reuse effect objects for performance
- **Priority System**: Important effects override less important ones
- **Batching**: Group similar effects for efficient rendering

#### **Advanced Features**
- **Weather System**: Dynamic rain/snow particle effects
- **Day/Night Cycle**: Gradual lighting transitions
- **Screen Effects**: Camera shake, zoom effects, transitions
- **Damage Feedback**: Screen flash, controller vibration
- **Performance Scaling**: Automatically reduce effects on slower systems

---

## 🔧 **USER API DESIGN**

### **Simple Entity Setup**
```javascript
// Create entity
let ant = new AntEntity();

// Add sprite (automatic rendering!)
ant.setSprite(new Sprite2D(antImage, position, size));
ant.setRenderLayer("ANTS");

// Add effects (optional) - clean property-based API
ant.highlight.selected();
ant.effects.damageNumber(25, [255, 0, 0]); // Currently implemented  
ant.effects.floatingText("Level Up!", [0, 255, 0]); // Currently implemented

// OR using effects.add with current supported types:
ant.effects.add({
    type: "FLOATING_TEXT",
    text: "Gathering...",
    position: { x: ant.x, y: ant.y - 20 },
    color: [255, 255, 0],
    duration: 1500,
    fadeOut: true
});

// System handles everything else automatically!
```

### **Property-Based Delegation Pattern (Recommended)**
```javascript
// Inside Entity class - clean property-based delegation
class Entity {
    constructor() {
        this._renderController = new RenderController(this);
        this._sprite = null;
        this._renderLayer = "DEFAULT";
        
        // === HIGHLIGHT NAMESPACE ===
        this.highlight = {
            selected: () => this._renderController.highlightSelected(),
            hover: () => this._renderController.highlightHover(),
            boxHover: () => this._renderController.highlightBoxHover(),
            combat: () => this._renderController.highlightCombat(),
            set: (type, intensity) => this._renderController.setHighlight(type, intensity),
            clear: () => this._renderController.clearHighlight()
        };
        
        // === EFFECTS NAMESPACE ===
        this.effects = {
            add: (effect) => this._renderController.addEffect(effect),
            remove: (effectId) => this._renderController.removeEffect(effectId),
            clear: () => this._renderController.clearEffects(),
            damageNumber: (damage, color) => this._renderController.showDamageNumber(damage, color),
            healNumber: (heal) => this._renderController.showHealNumber(heal),
            floatingText: (text, color) => this._renderController.showFloatingText(text, color)
        };
        
        // === RENDERING NAMESPACE ===
        this.rendering = {
            setDebugMode: (enabled) => this._renderController.setDebugMode(enabled),
            setSmoothing: (enabled) => this._renderController.setSmoothing(enabled),
            render: () => this._renderController.render(),
            update: () => this._renderController.update()
        };
    }
    
    // === CORE ENTITY METHODS ===
    setSprite(sprite) { 
        this._sprite = sprite; 
        // Auto-assign sprite to render controller if it expects one
        if (this._renderController.setSprite) {
            this._renderController.setSprite(sprite);
        }
    }
    getSprite() { return this._sprite; }
    
    setRenderLayer(layer) { this._renderLayer = layer; }
    getRenderLayer() { return this._renderLayer; }
    
    // Advanced access for complex operations
    getRenderController() { return this._renderController; }
}
```

### **Advanced Customization**
```javascript
// Performance tuning
EntityRenderer.updateConfig({
    enableFrustumCulling: true,
    cullMargin: 100,
    maxBatchSize: 200
});

// Custom layer registration
RenderManager.registerLayerRenderer("CUSTOM_LAYER", myCustomRenderer);

// Performance monitoring
let stats = PerformanceMonitor.getFrameStats();
console.log(`FPS: ${stats.fps}, Entity Render: ${stats.entityTime}ms`);
```

### **Auto-Generated Delegation Pattern**
```javascript
// Utility to automatically generate delegation methods - zero code repetition
class EntityDelegationBuilder {
    static createDelegationMethods(entityClass, controllerProperty, methodList) {
        methodList.forEach(methodName => {
            entityClass.prototype[methodName] = function(...args) {
                return this[controllerProperty][methodName](...args);
            };
        });
    }
}

// Usage: Auto-generate all RenderController delegations
EntityDelegationBuilder.createDelegationMethods(Entity, '_renderController', [
    'highlightSelected', 'highlightHover', 'highlightBoxHover', 'highlightCombat',
    'setHighlight', 'clearHighlight', 'addEffect', 'removeEffect', 'clearEffects',
    'showDamageNumber', 'showHealNumber', 'showFloatingText', 'setDebugMode', 
    'setSmoothing', 'render', 'update'
]);

// Result: Zero repeated delegation code!
```

---

## 📊 **PERFORMANCE MONITORING**

### **Tracked Metrics**
- **Frame Rate**: Current FPS, average FPS, min/max FPS
- **Render Timing**: Per-layer render times, total frame time
- **Entity Stats**: Total entities, rendered count, culled count  
- **Memory Usage**: Texture memory, particle counts, effect counts
- **Efficiency**: Culling effectiveness, batching efficiency

### **Debug Display**
```
┌─────────────────────────────────────┐
│         PERFORMANCE MONITOR         │
├─────────────────────────────────────┤
│ FPS: 60.0 (avg: 59.2, min: 45.1)   │
│                                     │ 
│ Frame Time: 16.7ms                  │
│ ├─ Terrain:   2.1ms ( 12.6%)       │
│ ├─ Entities: 11.3ms ( 67.7%)       │
│ ├─ UI:        2.8ms ( 16.8%)       │
│ └─ Effects:   0.5ms (  3.0%)       │
│                                     │
│ Entities: 847 total, 623 rendered  │
│ Culling: 26.4% efficiency          │
│ Effects: 23 active particles       │
└─────────────────────────────────────┘
```

---

## 🚀 **IMPLEMENTATION PHASES**

### **Phase 1: Foundation**
1. Update `functionAsserts.js` with all safety checks
2. Create `PerformanceMonitor.js`
3. Remove safety checks from existing files
4. Standardize entity position/size API

### **Phase 2: Core Refactoring**  
1. Refactor `RenderLayerManager` (remove redundant logic)
2. Rename and refactor `EntityLayerRenderer` → `EntityRenderer`
3. Update `RenderController` (remove position detection)
4. Simplify `Sprite2D` (remove safety checks)

### **Phase 3: Enhanced Features**
1. Implement comprehensive UI layer system
2. Create advanced effects system
3. Add performance monitoring display
4. Implement user API improvements

### **Phase 4: Optimization**
1. Add effect pooling and batching
2. Implement performance scaling
3. Add advanced culling techniques
4. Optimize for mobile/web performance

---

## 📝 **NOTES & FUTURE CONSIDERATIONS**

- **Modularity**: Each system should be independently testable
- **Performance**: All systems should gracefully degrade on slower hardware  
- **Extensibility**: Easy to add new entity types, effects, and UI elements
- **Documentation**: Comprehensive API documentation for all user-facing features
- **Testing**: Unit tests for critical rendering logic and performance benchmarks

---

**Last Updated**: October 2, 2025  
**Next Review**: TBD based on implementation progress