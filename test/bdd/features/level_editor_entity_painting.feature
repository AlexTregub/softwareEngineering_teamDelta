Feature: Level Editor Entity Painting
  As a level designer
  I want to place and erase entities in the Level Editor
  So that I can create custom entity layouts for game levels

  Background:
    Given the Level Editor is open
    And the game state is LEVEL_EDITOR

  Scenario: Place and erase an entity using the entity painter
    Given the entity_painter tool is selected
    And the entity palette is open
    When the user clicks on an entity template
    Then the entity template should be selected
    
    When the user clicks on the canvas at grid position (15, 15)
    Then an entity should exist at grid position (15, 15)
    And the entity should be in the level data
    
    When the user selects the eraser tool
    Then the eraser tool should be active
    
    When the user switches to ENTITY eraser mode
    Then the ENTITY eraser mode should be active
    
    When the user clicks on the entity at grid position (15, 15)
    Then the entity should be removed from grid position (15, 15)
    And the entity should not be in the level data
    And the entity should not be in the spawn data

  Scenario: Place multiple entities in a row
    Given the entity_painter tool is selected
    And an entity template is selected
    When the user places entities at grid positions:
      | gridX | gridY |
      | 10    | 10    |
      | 11    | 10    |
      | 12    | 10    |
    Then entities should exist at all placed positions
    And all entities should be in the level data

  Scenario: Erase multiple entities
    Given multiple entities are placed on the canvas
    And the eraser tool is selected
    And ENTITY eraser mode is active
    When the user clicks on each entity to erase them
    Then all entities should be removed from the canvas
    And no entities should remain in the level data

  Scenario: Entity placement follows cursor
    Given the entity_painter tool is selected
    And an entity template is selected
    When the user moves the cursor over the canvas
    Then a preview of the entity should follow the cursor
    And the preview should snap to the grid

  Scenario: Cancel entity placement with Escape key
    Given the entity_painter tool is selected
    And an entity template is selected
    When the user presses the Escape key
    Then the entity template selection should be cleared
    And no preview should be shown

  Scenario: Entity painter integration workflow
    Given the Level Editor is active
    When the user clicks the entity_painter tool
    Then the entity_painter tool should be selected
    
    When the user selects an entity template from the palette
    Then the entity template should be selected
    
    When the user clicks on the terrain at grid position (10, 10)
    Then an entity should be placed at grid (10, 10)
    And the entity should be found at that position
    
    When the user exports the level to JSON
    Then the exported JSON should contain the placed entity
    
    When the user clears all entities
    And the user imports the level from JSON
    Then the entity should be restored at grid (10, 10)
    
    When the user removes the entity
    Then no entities should remain

  Scenario: Entity spawn data storage and export
    Given the Level Editor has spawn data storage
    When spawn data entries are added manually
    Then the spawn data format should be correct
    And the getEntitySpawnData method should return all entries
    
    When the level is exported to JSON
    Then the entities array should contain all spawn data
    And each entity should have required properties
    
    When an entity spawn data entry is removed by ID
    Then the spawn data count should decrease by one
    
    When all spawn data is cleared
    Then the spawn data count should be zero

  Scenario: Entity selection box functionality
    Given the EntitySelectionTool is created
    And multiple entities are placed on the grid
    When the user drags a selection box over the entities
    Then all entities within the box should be selected
    And the selected state should be visible
    
    When the user deletes selected entities
    Then all selected entities should be removed
    And no entities should remain in the array
