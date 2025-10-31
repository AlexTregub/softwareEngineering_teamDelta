# Feature Requests & Optimization Opportunities

Track feature requests, performance optimizations, and extensibility improvements. These are enhancements for future development, not bugs.

---

## Feature Requests Status

### Pending Review 📋

- [ ] **Level Editor: JSON Loading Error Handling**
  - Related Files: `Classes/systems/ui/LevelEditor.js` (loadLevel method), `Classes/terrainUtils/TerrainImporter.js`
  - Request: Improve error handling in JSON loading sequence to gracefully handle malformed data, missing fields, and version mismatches
  - Priority: MEDIUM (Quality of Life)
  - User Benefit: Better user experience when loading corrupted or outdated level files
  - Technical Requirements:
    - Validate JSON schema before parsing (version field, required sections)
    - Handle missing terrain/entities/events sections gracefully (provide defaults)
    - Display user-friendly error messages with recovery options
    - Log detailed error information for debugging
    - Implement version migration system for backward compatibility
  - Edge Cases to Handle:
    - Corrupted JSON (invalid syntax)
    - Missing required fields (terrain dimensions, entity types)
    - Invalid coordinates (negative, out-of-bounds)
    - Unknown entity types or event types
    - Version mismatches (old format vs new format)
  - Suggested Implementation:
    1. Add schema validation using JSON schema or manual checks
    2. Create error dialog UI component for user feedback
    3. Add version field to JSON format (semantic versioning)
    4. Implement migration functions for version upgrades
    5. Unit tests for all error conditions

- [ ] **Level Editor: Save/Load Extensibility for New Information Types**
  - Related Files: `Classes/systems/ui/LevelEditor.js` (saveLevel, loadLevel methods), `Classes/terrainUtils/TerrainExporter.js`, `Classes/terrainUtils/TerrainImporter.js`
  - Request: Make save/load functions extensible to handle new information types without breaking existing saves (version compatibility, schema evolution)
  - Priority: MEDIUM (Future-Proofing)
  - Developer Benefit: Easy to add new data types (lighting, spawn points, waypoints, etc.) without breaking old levels
  - Technical Requirements:
    - Plugin/adapter system for save/load modules
    - Version-based schema evolution (v1 → v2 migration)
    - Optional sections in JSON (new data ignored by old versions)
    - Registration system for custom data handlers
    - Backward compatibility guarantee (old levels load in new versions)
  - Potential New Information Types:
    - Lighting data (ambient, directional, point lights)
    - Spawn points (player, enemy, resource)
    - Waypoints and patrol paths
    - Trigger zones (scripted events)
    - Camera constraints (boundaries, focus points)
    - Audio zones (ambient sounds, music)
  - Suggested Implementation:
    1. Create SaveLoadPlugin interface with save/load/migrate methods
    2. Add plugin registry in LevelEditor
    3. Update JSON format with version and optional sections
    4. Write migration framework (v1 → v2 → v3 automatic)
    5. Document plugin creation for future developers
    6. Integration tests for version migration
  - Design Principle: "Open for extension, closed for modification" (SOLID principles)

- [ ] **Draggable Panels: Expose custommizable parameters to settings**
    - Related Files: [text](Classes/systems/ui/DraggablePanel.js) [text](Classes/systems/ui/DraggablePanelManager.js) [text](Classes/systems/ui/DraggablePanelSystem.js) [text](config/editor-settings.json)
    - Request: Be able to customize the look and feel of a panel to the users liking from
    a to be included settings option. These settings should be exposed to the settings menu
    via the editor settings config file.
    - Priority: LOW (QoL)
    - Developer Benefit: Easy to mock up the look and feel of a menu before creating assets

### In Progress 🚧

(No features currently in progress)

### Completed ✅

(No completed feature requests yet - features implemented during development go directly to CHANGELOG.md)

---

## Statistics

- **Total Requests**: 2
- **Pending Review**: 2
- **In Progress**: 0
- **Completed**: 0

---

## Submission Guidelines

When adding feature requests:
- Use descriptive titles
- Explain user/developer benefit
- List technical requirements
- Consider edge cases
- Suggest implementation approach
- Assign priority (LOW/MEDIUM/HIGH/CRITICAL)
- Reference related files

Feature requests move to "In Progress" when development starts, then to CHANGELOG.md when complete.
