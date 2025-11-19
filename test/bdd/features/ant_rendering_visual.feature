Feature: Ant Visual Rendering Verification
  As a developer
  I want to verify ants are actually visible in the canvas
  So I can confirm the rendering pipeline produces visual output

  Background:
    Given the game is loaded on "http://localhost:8000"

  Scenario: Canvas is initialized and ready for rendering
    When the player starts a new game
    And I wait for ants to be created
    Then the canvas element should exist
    And the canvas should have a valid 2D context
    And the canvas should have width greater than 0
    And the canvas should have height greater than 0
    And no JavaScript errors should be present

  Scenario: Ant sprites are loaded successfully
    When the player starts a new game
    And I wait for ants to be created
    Then all ant sprites should be loaded
    And all ant sprites should have valid dimensions
    And no sprite loading errors should exist

  Scenario: Camera viewport includes ant positions
    When the player starts a new game
    And I wait for ants to be created
    Then the camera should be initialized
    And at least one ant should be within the camera viewport
    And camera transforms should be valid

  Scenario: Rendering pipeline executes without errors
    When the player starts a new game
    And I wait for ants to be created
    And I trigger multiple render frames
    Then the draw function should execute successfully
    And EntityRenderer should render all layers
    And no rendering errors should be logged

  Scenario: Canvas contains non-grass pixels (ant pixels)
    When the player starts a new game
    And I wait for ants to be created
    And I capture the canvas screenshot
    Then the screenshot should contain non-grass colored pixels
    And the pixel count should indicate at least 5 ants

  Scenario: Visual regression comparison
    When the player starts a new game
    And I wait for ants to be created
    And I capture the current game state screenshot
    And I compare it with the baseline rendering
    Then the rendering should match expected visual output
    And detailed differences should be highlighted

  Scenario: Render call instrumentation
    When the player starts a new game
    And I wait for ants to be created
    And I enable render debugging
    And I trigger a render cycle
    Then render calls should be logged for each ant
    And render completion should be confirmed
    And drawing operations should be recorded

  Scenario: Frame-by-frame render progression
    When the player starts a new game
    And I wait for ants to be created
    And I capture screenshots for 5 consecutive frames
    Then each frame should show rendered content
    And ant positions should update between frames
    And static ants should remain visible
