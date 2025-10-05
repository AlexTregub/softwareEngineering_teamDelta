# DraggablePanel Integration Guide

## 🎯 How to Hook DraggablePanel Examples into the Render Pipeline

The DraggablePanel system has been fully integrated into your existing render pipeline. Here's how it works:

## ✅ **Integration Complete**

### **Files Added/Modified:**

1. **`Classes/systems/ui/DraggablePanelIntegration.js`** - Main integration layer
2. **`index.html`** - Added script reference
3. **`sketch.js`** - Added initialization and update calls

### **Render Pipeline Integration:**

The panels are automatically hooked into your existing `RenderLayerManager` at the **UI_GAME** layer, which means:

- ✅ **Proper layering** - Panels render above terrain/entities but below menus
- ✅ **State-aware** - Different panels show in different game states
- ✅ **Performance optimized** - Integrated with your existing render pipeline

## 🎮 **Game State Visibility**

Panels automatically show/hide based on game state:

```javascript
'MENU': [],                                    // No panels in menu
'PLAYING': ['tools', 'resources', 'stats'],   // Main gameplay panels
'PAUSED': ['tools', 'resources', 'stats'],    // Same as playing
'DEBUG_MENU': ['tools', 'resources', 'stats', 'debug'], // Plus debug
'GAME_OVER': ['stats']                         // Only stats
```

## 🔧 **Default Panels Created**

### **1. Tools Panel (Vertical Layout)**
- **Position**: Top-left (20, 80)
- **Buttons**: Spawn Ant, Clear Ants, Pause/Play, Debug Info
- **Features**: Vertical button layout, persistent position

### **2. Resources Panel (Grid Layout)**  
- **Position**: Left-center (180, 80)
- **Buttons**: Wood, Food, Stone, Info (2x2 grid)
- **Features**: Colored buttons, grid layout

### **3. Stats Panel (Mixed Content + Horizontal Buttons)**
- **Position**: Center (380, 80)  
- **Content**: Live ant count, resource count, FPS, frame count
- **Buttons**: Save, Load, Reset (horizontal layout)
- **Features**: Dynamic text content above buttons

### **4. Debug Panel (Vertical Layout)**
- **Position**: Right (600, 80)
- **Buttons**: Toggle Rendering, Performance, Entity Debug, Console Log
- **Visibility**: Only in DEBUG_MENU state

## 🚀 **Usage Examples**

### **Basic Usage (Already Working):**
```javascript
// The system initializes automatically!
// Panels appear when you run the game
```

### **Add Custom Panel:**
```javascript
g_draggablePanelManager.addPanel('my-panel', new DraggablePanel({
  id: 'my-custom-panel',
  title: 'My Panel',
  position: { x: 100, y: 200 },
  size: { width: 200, height: 150 },
  buttons: {
    layout: 'vertical',
    items: [
      {
        caption: 'Custom Action',
        onClick: () => console.log('Custom action!'),
        style: ButtonStyles.SUCCESS
      }
    ]
  }
}));

// Make it visible in PLAYING state
g_draggablePanelManager.setPanelVisibility('my-panel', ['PLAYING']);
```

### **Get Panel Reference:**
```javascript
const toolsPanel = g_draggablePanelManager.getPanel('tools');
toolsPanel.addButton({
  caption: 'New Feature',
  onClick: () => console.log('New feature activated!'),
  style: ButtonStyles.PURPLE
});
```

## 🎨 **Button Styles Available**

All existing `ButtonStyles` work:
- `ButtonStyles.DEFAULT` - Blue
- `ButtonStyles.SUCCESS` - Green  
- `ButtonStyles.WARNING` - Orange
- `ButtonStyles.DANGER` - Red
- `ButtonStyles.PURPLE` - Purple

Plus custom colors:
```javascript
{
  caption: 'Wood',
  style: { ...ButtonStyles.DEFAULT, backgroundColor: '#8B4513' }
}
```

## 🔍 **Testing the Integration**

1. **Run the game** - Panels should appear automatically
2. **Try dragging panels** - They should move smoothly and persist position
3. **Click buttons** - Each button logs its action to console
4. **Change game states** - Panels show/hide appropriately
5. **Toggle debug mode** - Debug panel should appear

## 🛠 **Customization**

### **Change Panel Visibility:**
```javascript
// Show resources panel in menu too
g_draggablePanelManager.setPanelVisibility('resources', ['MENU', 'PLAYING']);
```

### **Modify Button Actions:**
```javascript
const panel = g_draggablePanelManager.getPanel('tools');
panel.getButton(0).setOnClick(() => {
  console.log('Modified spawn action!');
  // Your custom spawn logic
});
```

### **Add Image Buttons:**
```javascript
// In panel configuration
{
  caption: 'Wood',
  image: loadImage('wood-icon.png'), // Add this
  onClick: () => selectWood()
}
```

## ⚡ **Performance Notes**

- ✅ **Efficient rendering** - Only updates visible panels
- ✅ **Smart updates** - Buttons only update when not dragging panel
- ✅ **Integrated profiling** - Works with existing performance monitoring

## 🐛 **Debugging**

Check browser console for:
- `✅ DraggablePanelManager integrated into render pipeline`
- `✅ Draggable panels initialized and integrated`

If panels don't appear, verify:
1. `RenderLayerManager` is initialized
2. Game state is not 'MENU' (no panels show in menu by default)
3. No JavaScript errors in console

## 🎯 **Next Steps**

You can now:
1. **Add your own panels** with custom button layouts
2. **Connect button actions** to your game systems
3. **Add image buttons** for better visual feedback
4. **Create context-sensitive panels** that appear in specific game situations

The system is fully integrated and ready for your game logic!