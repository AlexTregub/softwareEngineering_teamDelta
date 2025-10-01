# Universal Entity Debugger System

A comprehensive debugging system for runtime object introspection and visualization in the softwareEngineering_teamDelta project.

## 🚀 Quick Start

The debugger automatically integrates with all `Entity` instances. Simply press the **backtick (`) key** to toggle debugging visualization.

### Keyboard Controls

| Key Combination | Action |
|----------------|--------|
| **`** | Toggle debug for nearest entities |
| **Shift + `** | Show ALL entity debuggers |
| **Alt + `** | Hide all entity debuggers |
| **Ctrl + `** | Cycle through selected entity debuggers |

## 🔍 Features

### 1. **Universal Object Introspection**
- Analyzes any JavaScript object's properties, methods, getters, and setters
- Traverses prototype chains to discover inherited functionality
- Provides type analysis and inheritance chain mapping
- Supports function signature extraction and async/generator detection

### 2. **Visual Bounding Box System**
- Automatically detects object bounds using multiple strategies:
  - **CollisionBox2D/bounds objects** - Direct x/y/width/height extraction
  - **Position-size properties** - Supports x/y, posX/posY, position.x/y variants
  - **Sprite objects** - Extracts from sprite.pos and sprite.size
  - **Center-size properties** - Calculates bounds from center point and dimensions
- Draws **outline-only** colored bounding boxes (no fill for visibility)
- Corner markers for precise boundary identification
- Shows object type and dimension labels with semi-transparent background

### 3. **Property Inspection Panel**
- Real-time display of object statistics
- Shows property count, method count, and type information
- Configurable positioning and visibility

### 4. **Real-time Performance Monitoring**
- **Execution time tracking**: Monitors update() and render() method performance
- **Memory usage graphs**: Tracks JavaScript heap usage (when available)
- **Frame rate analysis**: Displays update and render frequencies
- **Visual performance graphs**: Real-time charts showing performance trends
- **Statistical analysis**: Average, peak, and current performance metrics
- **Interactive graph controls**: Click buttons (U/R/M/S) to toggle individual graph types
- **Summary graphs**: Combined performance view showing total system performance
- **Global aggregation**: System-wide performance data collection and analysis

### 5. **Global Debug Management**
- Centralized control over all entity debuggers
- Performance-conscious (limits visible debuggers)
- Auto-cleanup of inactive entities
- Integration with existing debug toggle system

## 📁 Files Structure

```
debug/
├── UniversalDebugger.js     # Core debugger class
├── EntityDebugManager.js    # Global debug manager
└── debuggerDemo.js         # Usage examples and integration
```

## 🎯 Usage Examples

### Basic Entity Creation with Debugging
```javascript
// Entities automatically get debuggers when created
const antEntity = new Entity(100, 100, 32, 32, {
  type: "Ant",
  debugBorderColor: '#FF0000',  // Custom debug color
  showDebugPanel: true          // Enable property panel
});

// Manual debugger control
antEntity.toggleDebugger(true);  // Enable
console.log(antEntity.isDebuggerActive());  // Check state
```

### Global Debug Control
```javascript
const manager = getEntityDebugManager();

// Show all debuggers
manager.showAllDebuggers();

// Hide all debuggers  
manager.hideAllDebuggers();

// Get debug statistics
console.log(manager.getDebugStats());
```

### Custom Configuration
```javascript
// Configure debugger appearance per entity type
const debugConfig = {
  borderColor: '#00FF00',       // Green border
  fillColor: 'rgba(0,0,0,0)',   // No fill (transparent)
  borderWidth: 3,               // Thicker border
  fontSize: 12,                 // Larger text
  autoRefresh: true             // Auto-update data
};

const entity = new Entity(x, y, w, h, { debugConfig });
```

### Console Commands
Open the browser console and try these commands:
```javascript
// Run automatic demo
demonstrateEntityDebugger();

// Debug entities near mouse position
debugNearestEntities(mouseX, mouseY, 100);

// Debug only selected entities
debugSelectedEntities();

// Show debug statistics
const manager = getEntityDebugManager();
console.log(manager.getDebugStats());

// Adjust debug limits
setDebugLimit(25);              // Set limit to 25 entities
console.log(getDebugLimit());   // Check current limit
forceShowAllDebuggers();        // Force show all (ignores limits)

// Performance monitoring
showPerformanceData();          // Display performance stats for all debuggers
resetPerformanceData();         // Reset performance tracking data
togglePerformanceGraphs(true);  // Enable/disable performance graphs

// Individual graph controls (Version 1.3)
toggleUpdateGraphs(true);       // Toggle update time graphs on/off
toggleRenderGraphs(false);      // Toggle render time graphs on/off
toggleMemoryGraphs();           // Toggle memory graphs (no param = toggle current state)
toggleSummaryGraphs(true);      // Toggle combined summary graphs on/off
setAllGraphs(false);            // Enable/disable all graph types at once
getGraphStates();               // View current toggle states for all debuggers

// Global performance summary (Version 1.3)
showGlobalPerformance();        // Display aggregated performance data from all debuggers
drawGlobalSummary(10, 10, 300, 200); // Instructions for drawing global summary graph

// Global performance toggle controls (Version 1.4)
toggleGlobalPerformance(true);  // Enable/disable global performance summary display
toggleGlobalPerformance();      // Toggle current state (no parameter)
getGlobalPerformanceState();    // Check if global performance summary is currently enabled
```

## ⚙️ Configuration Options

### UniversalDebugger Config
```javascript
{
  showBoundingBox: true,           // Show visual bounding box
  showPropertyPanel: true,         // Show property inspection panel
  showPerformanceGraph: true,      // Show real-time performance graphs
  borderColor: '#FF0000',          // Bounding box border color
  fillColor: 'rgba(255,0,0,0)',    // Transparent fill (no background)
  borderWidth: 2,                  // Border thickness
  fontSize: 12,                    // Text size for labels
  autoRefresh: false,              // Auto-update introspection data
  maxDepth: 3,                     // Maximum object analysis depth
  performanceHistoryLength: 60,    // Frames of performance data to keep
  graphWidth: 200,                 // Performance graph width
  graphHeight: 100                 // Performance graph height
}
```

### EntityDebugManager Config
```javascript
{
  toggleKey: '`',               // Primary toggle key
  maxVisibleDebuggers: 50,      // Performance limit (increased from 10)
  forceShowAllLimit: 200,       // Maximum when forcing "show all"
  autoHideDelay: 5000,          // Auto-hide timeout (ms)
  debugColors: [...]            // Color palette for entities (expanded)
}
```

## 🔧 Integration with Existing Systems

The debugger integrates seamlessly with:
- **Entity System**: Automatic initialization for all entities
- **Backtick Debug Toggle**: Uses existing ` key handler
- **Menu Debug System**: Shares event handling infrastructure
- **Command Line Interface**: Adds debug commands if available

## 🎨 Visual Features

- **Color-coded entities**: Each entity gets a unique debug color from expanded palette
- **Outline-only rendering**: No fill backgrounds for better entity visibility
- **Corner markers**: Precise boundary identification with colored squares
- **Type labels**: Entity class and dimensions with semi-transparent backgrounds
- **Property panels**: Expandable information overlays (optional)
- **Real-time performance graphs**: Multi-chart visualization showing:
  - Update time trends (green line graph)
  - Render time trends (blue line graph)  
  - Memory usage trends (orange line graph)
  - Current values and min/max indicators
- **Performance optimization**: Smart limiting with adjustable thresholds

## 🚨 Performance Notes

- **Lazy evaluation**: Introspection only runs when debugger is active
- **Smart limiting**: Maximum 50 visible debuggers by default (5x increase from original)
- **Force override**: Shift+` bypasses limits, showing up to 200 entities
- **Auto-cleanup**: Removes debuggers from inactive entities automatically
- **Efficient rendering**: Outline-only drawing with p5.js push/pop state management
- **Dynamic limits**: Runtime adjustment via `setDebugLimit(n)` console command
- **Color optimization**: 16-color palette prevents repetition in medium scenes

## 🧪 Testing & Development

Run the automatic demo:
```javascript
// In browser console after page loads
demonstrateEntityDebugger();
demonstrateGlobalDebugManager();
```

The system includes comprehensive examples and integrates with existing test suites.

## 📋 Requirements

- **p5.js**: For rendering and graphics
- **Entity System**: Requires Entity base class
- **Modern Browser**: ES6+ support for classes and modules

## 🎉 Getting Started

1. **Create entities** - They automatically get debuggers
2. **Press `** - Toggle debugging for nearest entities
3. **Use modifiers** - Shift/Alt/Ctrl + ` for advanced controls
4. **Check console** - Rich debug information and statistics
5. **Customize** - Configure colors, panels, and behavior

The debugger system is designed to be zero-configuration for basic use while providing extensive customization options for advanced debugging scenarios.

## 🔄 Recent Updates

### Version 1.1 - Visual Improvements
- **Removed white fill backgrounds** - Debuggers now use outline-only rendering for better entity visibility
- **Increased default limits** - Raised from 10 to 50 visible debuggers for larger scenes
- **Enhanced Shift+` behavior** - Force override now shows up to 200 entities
- **Expanded color palette** - 16 unique colors to reduce repetition
- **Console commands** - Added `setDebugLimit()`, `getDebugLimit()`, and `forceShowAllDebuggers()`

### Version 1.2 - Performance Monitoring
- **Real-time performance graphs** - Visual charts showing execution time and memory trends
- **Execution time tracking** - Monitors update() and render() method performance with millisecond precision
- **Memory usage monitoring** - Tracks JavaScript heap usage when available
- **Frame rate analysis** - Calculates and displays update/render frequencies
- **Statistical analysis** - Shows average, peak, and current performance metrics
- **Performance console commands** - Added `showPerformanceData()`, `resetPerformanceData()`, `togglePerformanceGraphs()`

### Version 1.3 - Individual Graph Controls & Global Summary
- **Individual graph toggles** - Click buttons (U/R/M/S) on each debugger to show/hide specific graphs
- **Default off behavior** - All individual graphs start disabled to reduce visual clutter
- **Interactive button controls** - Visual feedback with color-coded toggle states
- **Summary graph functionality** - Combined performance view showing total execution times
- **Global performance aggregation** - Collects data from all active debuggers for system-wide analysis
- **Enhanced console commands** - Added `toggleUpdateGraphs()`, `toggleRenderGraphs()`, `toggleMemoryGraphs()`, `toggleSummaryGraphs()`, `setAllGraphs()`, `getGraphStates()`, `showGlobalPerformance()`, `drawGlobalSummary()`

### Version 1.4 - Visual Global Performance Toggle
- **On-screen toggle button** - Visual "Show/Hide Global Perf" button in global summary panel
- **Always visible button** - Toggle button displays even when performance data is hidden
- **Click interaction** - Click the button to toggle global performance summary visibility
- **Visual feedback** - Button changes color (green=enabled, gray=disabled) based on state
- **Console integration** - Added `toggleGlobalPerformance()` and `getGlobalPerformanceState()` commands
- **Smart positioning** - Button positioned in top-right of global summary area for easy access

### Integration Status
- ✅ **Entity System**: Fully integrated with automatic debugger initialization
- ✅ **Keyboard Controls**: All modifier combinations working (`/Shift+`/Alt+`/Ctrl+`)  
- ✅ **Performance Optimization**: Smart limiting with runtime adjustment
- ✅ **Visual Polish**: Outline rendering with corner markers and labels
- ✅ **Performance Monitoring**: Real-time graphs with execution time and memory tracking
- ✅ **Interactive Controls**: Clickable graph toggles with visual feedback
- ✅ **Global Summary**: System-wide performance aggregation and visualization
- ✅ **Visual Toggle Button**: On-screen clickable global performance toggle