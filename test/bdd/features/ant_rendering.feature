Feature: Ant Rendering System
  As a player
  I want to see ants displayed on the game map
  So that I can observe ant behavior and colony activity

  Background:
    Given the game is loaded on "http://localhost:8000"

  Scenario: Game starts with visible ants
    When the player starts a new game
    And the game completes initialization
    Then ants should be visible on the map
    And the EntityManager should contain ant entities

  Scenario: Multiple ants render simultaneously
    When the player starts a new game
    And the game completes initialization
    Then at least 5 ants should be registered in EntityManager
    And each ant should have a render method

  Scenario: Ants render in correct layer
    When the player starts a new game
    And the game completes initialization
    Then ants should render in the ENTITIES layer
    And the ENTITIES layer should be above TERRAIN layer

  Scenario: Worker ants display correct sprite
    When the player starts a new game
    And the game completes initialization
    Then worker ants should use the worker sprite
    And the sprite path should match "gray_ant.png"

  Scenario: Ant positions update correctly
    When the player starts a new game
    And the game completes initialization
    And an ant is selected
    And the ant moves to a new location
    Then the ant position should update on screen
    And the EntityManager should reflect the new position

  Scenario: EntityLayerRenderer collects ants
    When the player starts a new game
    And the game completes initialization
    Then the EntityLayerRenderer should collect ants from EntityManager
    And the collected ants should be in the ANTS render group

  Scenario: Complete MVC rendering pipeline
    When the player starts a new game
    And the game completes initialization
    Then each ant should have a model component
    And each ant should have a view component
    And each ant should have a controller component
    And the controller should delegate rendering to the view

  Scenario: Ants render with camera transform
    When the player starts a new game
    And the game completes initialization
    And the camera pans to a new location
    Then ants should render in screen coordinates
    And world coordinates should transform correctly

  Scenario: Ants respect visibility culling
    When the player starts a new game
    And the game completes initialization
    And the camera moves far from ant locations
    Then off-screen ants should not waste rendering resources
    And only visible ants should be processed

  Scenario: Game state transitions maintain ant rendering
    Given the game is in "PLAYING" state
    When the player pauses the game
    Then ants should remain visible
    When the player resumes the game
    Then ants should continue rendering normally

  Scenario: Ant count displayed in UI matches EntityManager
    When the player starts a new game
    And the game completes initialization
    Then the UI should display the correct ant count
    And the count should match EntityManager ant count

  Scenario: Factory-created ants auto-register
    When the player starts a new game
    And the game completes initialization
    And a new ant is created via AntFactory
    Then the ant should auto-register with EntityManager
    And the ant should appear in the next render cycle
