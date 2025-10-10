# Tooltip System Recursion Fix

## Problem Analysis (October 9, 2025)

### Root Cause: Circular Dependency

The tooltip system was experiencing infinite recursion due to a circular dependency between:

1. **TooltipController.generateTooltipContent()** → calls `entity.getTooltipData()`
2. **Entity.getTooltipData()** → gets tooltip controller and calls `tooltipController.generateTooltipContent().lines`

This created an infinite loop: `TooltipController → Entity → TooltipController → Entity → ...`

### Error Manifestation

InternalError: too much recursion at TooltipController.js:159:12

The browser's call stack was overflowing due to this circular reference.

## Solution Applied

### 1. Broke the Circular Dependency

**Entity.js - getTooltipData() method:**

- **Before**: Called tooltip controller's `generateTooltipContent()` method
- **After**: Returns empty array by default, with clear documentation that subclasses should override this method
- **Impact**: Eliminates the circular call pattern

### 2. Added Recursion Guard

**TooltipController.js - generateTooltipContent() method:**

- Added `_generatingContent` flag to prevent recursive calls
- Uses try-finally block to ensure flag is always reset
- Provides error message if recursion is detected
- **Impact**: Additional safety net against any future recursion issues

### 3. Proper Error Handling

- Enhanced error catching for custom tooltip data functions
- Graceful degradation when errors occur
- Clear error messages in tooltip content for debugging

## Technical Details

### Fixed Code Flow

TooltipController.generateTooltipContent()
├── Sets recursion guard (_generatingContent = true)
├── Generates basic tooltip info (name, position, health, etc.)
├── Calls entity.getTooltipData() → Returns empty array (no recursion)
├── Processes custom controller data
└── Resets recursion guard (_generatingContent = false)

### Recursion Prevention Logic

```javascript
// In TooltipController.generateTooltipContent()
if (this._generatingContent) {
  console.warn('TooltipController: Prevented recursion in generateTooltipContent');
  return { lines: [{ text: 'Error: Tooltip recursion detected', style: 'error' }] };
}
this._generatingContent = true;

try {
  // Generate tooltip content...
} finally {
  this._generatingContent = false; // Always reset, even if error occurs
}
```

### Entity Method Update

```javascript
// In Entity.getTooltipData()
getTooltipData() {
  // Return empty array by default - subclasses should override this
  // DO NOT call tooltip controller here to avoid infinite recursion
  return [];
}
```

## Expected Results

- **✅ No more recursion errors** in tooltip system
- **✅ Tooltips display correctly** with basic entity information
- **✅ Performance improvement** by eliminating infinite loops
- **✅ Better error handling** with graceful degradation
- **✅ Extensible design** - subclasses can override `getTooltipData()` safely

## Usage for Developers

### To Add Custom Tooltip Data

Override the `getTooltipData()` method in your entity subclasses:

```javascript
class MyCustomEntity extends Entity {
  getTooltipData() {
    return [
      { text: `Custom Property: ${this.myProperty}`, style: 'stat' },
      { text: `Special Value: ${this.specialValue}`, style: 'value' }
    ];
  }
}
```

### Style Options Available

- `'header'` - Bold header text
- `'normal'` - Regular text
- `'stat'` - Highlighted statistics
- `'value'` - Important values
- `'warning'` - Warning-style text
- `'error'` - Error-style text

The fix maintains full backward compatibility while eliminating the recursion issue and providing a safer, more maintainable tooltip system.
