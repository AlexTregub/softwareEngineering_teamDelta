Feature: Ant Rendering and Visual Validation
  As a player
  I want ants to be visually rendered correctly
  So that I can see and interact with ants in the game

  Background:
    Given I have opened the game application in a browser
    And the rendering system is initialized
    And the Entity rendering pipeline is active

  @core @rendering @sprites
  Scenario: Ant sprites render with correct job images
    Given I spawn an ant with job "Builder"
    Then the ant should display the Builder job sprite image
    And the sprite should be positioned correctly on screen
    And the sprite should be the appropriate size (default or job-specific)
    And the sprite image should be loaded and visible

  @rendering @highlighting
  Scenario: Ant highlighting works correctly with job display
    Given I have an ant with job "Scout" rendered on screen
    When I select the ant
    Then the ant should be highlighted visually
    And the highlighting should be clearly visible
    And the job nametag should remain visible during highlighting
    And the highlighting should not interfere with job text display
    When I deselect the ant
    Then the highlighting should be removed
    And the ant should return to normal visual state

  @rendering @multiple
  Scenario: Multiple ants render without visual conflicts
    Given I spawn 10 ants with mixed jobs in various positions
    When all ants are rendered on screen
    Then all ant sprites should be visible
    And no sprites should be corrupted or missing
    And all job nametags should be readable
    And no visual elements should overlap inappropriately
    And each ant should be individually distinguishable

  @rendering @movement
  Scenario: Ant rendering updates correctly during movement
    Given I spawn an ant with job "Scout" at position (100, 100)
    When I command the ant to move to position (200, 200)
    Then the ant sprite should animate smoothly to the new position
    And the job nametag should follow the sprite movement
    And the rendering should remain consistent during movement
    And the ant should be visible throughout the movement path

  @rendering @layers
  Scenario: Ant rendering respects render layer system
    Given I have ants rendered on screen
    When I toggle different render layers through RenderLayerManager
    Then ant visibility should respect the layer settings
    And ants should appear/disappear based on layer configuration
    And job nametags should follow the same layer visibility rules

  @rendering @collision-detection
  Scenario: Ant collision boxes render correctly for interaction
    Given I spawn ants with different sizes and jobs
    When I inspect the collision detection areas
    Then each ant should have a proper collision box
    And collision boxes should match the visual sprite boundaries
    And mouse interaction should work within collision boundaries
    And collision detection should be accurate for selection

  @rendering @performance
  Scenario: Ant rendering maintains good performance
    Given I spawn 25 ants across the visible screen area
    When all ants are rendered simultaneously
    Then the frame rate should remain above 30 FPS
    And rendering should not cause noticeable lag
    And ant animations should be smooth
    And the browser should remain responsive

  @rendering @entity-integration
  Scenario: Ant rendering integrates properly with Entity system
    Given I spawn an ant that inherits from Entity
    When the ant is rendered through Entity rendering pipeline
    Then the RenderController should be properly initialized
    And sprite rendering should work through Sprite2D component
    And Entity rendering methods should be accessible
    And the ant should render consistently with other entities

  @rendering @debug-integration
  Scenario: Ant rendering works correctly with debug systems
    Given I have ants rendered on screen
    When I enable the Universal Debug System
    Then debug overlays should appear over ants as configured
    And ant rendering should not interfere with debug displays
    And debug information should be visible alongside ant rendering
    When I disable debug mode
    Then debug overlays should be removed
    And normal ant rendering should resume

  @rendering @viewport
  Scenario: Ant rendering handles viewport changes correctly
    Given I have ants rendered across a large game area
    When I scroll or pan the viewport
    Then ants should remain visible when in viewport
    And ants should be culled when outside viewport (for performance)
    And rendering should be consistent across viewport changes
    And no visual artifacts should occur during viewport movement

  @rendering @transparency
  Scenario: Ant rendering handles transparency and effects correctly
    Given I spawn ants with various visual states
    When ants have different highlight states or transparency
    Then transparency effects should render correctly
    And layering should be appropriate (sprite, highlight, nametag)
    And visual effects should not interfere with each other
    And all visual elements should be properly composited

  @rendering @error-handling
  Scenario: Ant rendering handles missing or invalid assets gracefully
    Given I spawn an ant with a job that has missing image assets
    When the ant attempts to render
    Then the rendering should not crash or break
    And a fallback image should be used if available
    And the ant should still be functionally interactive
    And error handling should log appropriate warnings

  @rendering @resolution
  Scenario: Ant rendering adapts to different screen resolutions
    Given I have ants rendered on screen
    When I change the browser window size or zoom level
    Then ant sprites should scale appropriately
    And job nametags should remain readable
    And positioning should be maintained relative to screen size
    And no visual elements should be cut off or distorted

  @rendering @state-visual
  Scenario: Ant visual state reflects internal state correctly
    Given I spawn an ant in "IDLE" state
    When the ant transitions to "MOVING" state
    Then the visual representation should reflect the state change
    And movement animation should be active
    When the ant enters "IN_COMBAT" state
    Then combat visual indicators should appear if implemented
    And the visual state should always match the internal state

  @rendering @z-index
  Scenario: Ant rendering respects proper z-index layering
    Given I have multiple ants and other game elements on screen
    When elements overlap in the game world
    Then ants should render at appropriate z-levels
    And job nametags should appear above sprites but below UI
    And highlighting should appear above normal sprites
    And layering should be consistent and predictable