# ResourceSystemManager Integration Guide

## Overview

The resource management system has been upgraded to use a new unified `ResourceSystemManager` class that combines the functionality of the previous `resourcesArray` and `ResourceSpawner` classes. This provides better organization, enhanced functionality, and maintains backward compatibility.

## Key Changes

### New Architecture

**Before:**

```javascript
g_resourceList = new resourcesArray();
g_entityInventoryManager = new ResourceSpawner(1, 50, g_resourceList);
```

**After:**

```javascript
g_entityInventoryManager = new ResourceSystemManager(1, 50);
g_resourceList = new resourcesArrayCompat(g_entityInventoryManager); // Backward compatibility
```

### Class Structure

#### ResourceSystemManager

- **Location:** `Classes/managers/ResourceSystemManager.js`
- **Purpose:** Unified resource collection, spawning, and selection system

**Key Features:**

- Resource collection and management
- Automated spawning with game state integration
- Resource type selection for UI
- Comprehensive debugging and status information
- Verbosity system integration

#### resourcesArrayCompat

- **Location:** `Classes/resource.js`
- **Purpose:** Maintains backward compatibility for existing code
- **Functionality:** Delegates all operations to `ResourceSystemManager`

## API Reference

### ResourceSystemManager Methods

#### Resource Collection

- `getResourceList()` - Get all resources
- `addResource(resource)` - Add a resource to the system
- `removeResource(resource)` - Remove a specific resource
- `clearAllResources()` - Remove all resources
- `getResourcesByType(type)` - Get resources of a specific type

#### Resource Spawning

- `startSpawning()` - Begin automatic resource spawning
- `stopSpawning()` - Stop automatic resource spawning
- `forceSpawn()` - Immediately spawn one resource
- `spawn()` - Internal spawning method

#### Resource Selection (UI Integration)

- `selectResource(resourceType)` - Select a resource type for UI highlighting
- `getSelectedResourceType()` - Get currently selected type
- `clearResourceSelection()` - Clear resource selection
- `isResourceTypeSelected(type)` - Check if a type is selected
- `getSelectedTypeResources()` - Get resources of selected type
- `setSelectedType(type)` - Alias for selectResource
- `setFocusedCollection(enabled)` - Enable focused collection mode

#### System Management

- `update()` - Update all resources (call each frame)
- `render()` - Render all resources (call each frame)
- `getSystemStatus()` - Get comprehensive system status
- `getDebugInfo()` - Get detailed debug information
- `destroy()` - Clean shutdown of the system

### Backward Compatibility

The following legacy interfaces are preserved:

```javascript
// These still work as before
g_resourceList.getResourceList()
g_resourceList.drawAll()
g_resourceList.updateAll()
g_resourceList.resources // getter property
g_resourceList.clear()
g_resourceList.setSelectedType(type)
```

## Migration Guide

### For Existing Code

Most existing code will continue to work without changes due to the compatibility layer. However, for new code, prefer using the `ResourceSystemManager` directly:

**Old Pattern:**
```javascript
if (g_resourceList && g_resourceList.getResourceList) {
  const resources = g_resourceList.getResourceList();
  // work with resources
}
```

**New Pattern:**
```javascript
if (g_entityInventoryManager && g_entityInventoryManager.getResourceList) {
  const resources = g_entityInventoryManager.getResourceList();
  // work with resources
}
```

### Updated Components

The following components have been updated to use the new system:

1. **EntityInventoryManager.js** - Now works with both old and new systems
2. **DraggablePanelManager.js** - Updated selectResource method
3. **DraggablePanelSystem.js** - Updated resource counting
4. **RenderLayerManager.js** - Updated resource spawning
5. **ShareholderDemo.js** - Updated resource clearing

### Configuration Options

The `ResourceSystemManager` constructor accepts options:

```javascript
const options = {
  autoStart: true,        // Start spawning automatically
  enableLogging: true     // Enable console logging
};

g_entityInventoryManager = new ResourceSystemManager(1, 50, options);
```

## Summary

This integration provides a more robust, unified resource management system while maintaining complete backward compatibility. The new `ResourceSystemManager` offers enhanced functionality for UI integration, better debugging capabilities, and improved performance. All existing code will continue to work, while new features are available for enhanced resource interaction and management.

### Key Benefits

- Unified resource collection and spawning system
- Resource type selection for UI highlighting
- Comprehensive debug and status reporting
- Game state integration with automatic start/stop
- Verbosity system integration for controlled logging
- Full backward compatibility with existing code

### Testing

Run the integration test: `globalThis.testResourceSystemManager()`

### Debug Commands

```javascript
// Check system status
g_entityInventoryManager.getSystemStatus()

// Test resource selection
g_entityInventoryManager.selectResource('food')

// Manual spawn
g_entityInventoryManager.forceSpawn()
```