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
