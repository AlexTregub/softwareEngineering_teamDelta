Feature: Level Editor Entity Selection
  As a level designer
  I want to select and manipulate multiple entities using a selection box
  So that I can efficiently manage entity placement

  Background:
    Given the Level Editor is open
    And the EntitySelectionTool is created

  Scenario: Select and delete multiple entities with selection box
    Given multiple entities are placed on the grid
    When the user drags a selection box from (50, 50) to (350, 150)
    Then all entities within the box should be selected
    And the selected state should be visible
    When the user deletes selected entities
    Then all selected entities should be removed
    And no entities should remain in the array

  Scenario: Select specific entities in a region
    Given entities are placed at positions:
      | x   | y   |
      | 100 | 100 |
      | 200 | 100 |
      | 300 | 100 |
      | 400 | 200 |
    When the user drags a selection box from (50, 50) to (350, 150)
    Then 3 entities should be selected
    And the entity at (400, 200) should not be selected
