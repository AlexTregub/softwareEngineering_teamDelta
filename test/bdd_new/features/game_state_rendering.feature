Feature: Game State Rendering
  As a game developer
  I want the rendering system to show appropriate layers based on game state
  So that users see the right interface elements for each game mode

  Background:
    Given I have a render layer manager
    And I have mocked all global dependencies
    And the render manager is initialized
    And I have layer renderers that track call order

  Scenario: PLAYING state shows game layers
    Given the game is in "PLAYING" state
    When I request the rendering system to render
    Then the "TERRAIN,ENTITIES,UI_GAME,UI_DEBUG" layers should be rendered
    And the "UI_MENU" layers should not be rendered
    And the "TERRAIN" layer should render before "ENTITIES"
    And the "ENTITIES" layer should render before "UI_GAME"

  Scenario: MENU state shows minimal layers
    Given the game is in "MENU" state
    When I request the rendering system to render
    Then the "TERRAIN,UI_MENU" layers should be rendered
    And the "ENTITIES,UI_GAME,UI_DEBUG" layers should not be rendered

  Scenario: PAUSED state maintains entity visibility
    Given the game is in "PAUSED" state
    When I request the rendering system to render
    Then the "TERRAIN,ENTITIES,UI_GAME" layers should be rendered
    And the "UI_DEBUG,UI_MENU" layers should not be rendered

  Scenario: DEBUG_MENU state shows all layers
    Given the game is in "DEBUG_MENU" state
    When I request the rendering system to render
    Then the "TERRAIN,ENTITIES,UI_DEBUG,UI_MENU" layers should be rendered
    And the "UI_GAME" layers should not be rendered