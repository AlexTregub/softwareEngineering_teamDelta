# Managers

This folder contains manager classes that handle game state and coordination between different systems.

## Files

### AntManager.js

**Purpose**: Manages ant selection, movement, and interaction logic.

**Key Features**:
- Centralized ant selection state management
- Mouse interaction handling for ant selection
- Safe ant retrieval from global arrays
- Parameter validation and error reporting
- Debug information and state introspection

**Methods**:
- `handleAntClick()` - Process mouse clicks for ant selection/movement
- `moveSelectedAnt(resetSelection)` - Move selected ant to mouse position
- `selectAnt(antCurrent)` - Select ant if under mouse cursor
- `getAntObject(antIndex)` - Safely retrieve ant from arrays
- `getSelectedAnt()` - Get currently selected ant
- `setSelectedAnt(ant)` - Set the selected ant
- `clearSelection()` - Clear current selection
- `hasSelection()` - Check if ant is selected
- `getDebugInfo()` - Get manager state information

**Legacy Compatibility Methods**:
- `AntClickControl()` - Legacy wrapper for handleAntClick()
- `MoveAnt(resetSection)` - Legacy wrapper for moveSelectedAnt()
- `SelectAnt(antCurrent)` - Legacy wrapper for selectAnt()
- `getAntObj(antIndex)` - Legacy wrapper for getAntObject()

**Usage**:
```javascript
// Global instance (automatically created)
const manager = new AntManager();

// Handle click interactions
manager.handleAntClick();

// Check selection state
if (manager.hasSelection()) {
  const selected = manager.getSelectedAnt();
  console.log('Selected ant at:', selected.posX, selected.posY);
}

// Clear selection
manager.clearSelection();
```

**Integration**:
- Used by: `ants.js`, `sketch.js`, selection systems
- Depends on: Global `ants` array, `mouseX/mouseY`, `IncorrectParamPassed`
- Backward compatible with original function names

**Testing**: Full test suite in `test/antManager.test.js`

## Architecture Notes

The managers folder follows these principles:

1. **Separation of Concerns**: Each manager handles a specific domain
2. **State Encapsulation**: Managers own and protect their state
3. **Backward Compatibility**: Original function signatures are preserved
4. **Error Handling**: Comprehensive parameter validation
5. **Testing**: Each manager has isolated test coverage

## Future Managers

Consider adding managers for:
- `ResourceManager` - Handle resource collection and distribution
- `CombatManager` - Manage ant combat interactions
- `TerrainManager` - Handle terrain detection and effects
- `UIManager` - Coordinate user interface elements