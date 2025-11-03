# Custom Level Camera - Bounded Follow System
# BDD Feature Tests for user-facing camera behavior

Feature: Custom Level Camera with Bounded Following
  As a player loading a custom level
  I want the camera to keep the queen centered in view
  So I can see surrounding threats equally in all directions

  Background:
    Given the game is running in a browser
    And I have loaded a custom level with a 3200x3200 pixel map
    And the queen ant is spawned on the map
    And the camera system is initialized

  # ========================================
  # Scenario Group: Queen Visibility
  # ========================================
  
  Scenario: Queen starts centered in viewport
    Given the queen spawns at the center of the map
    When the custom level finishes loading
    Then the queen should be visible in the center of the viewport
    And the camera should be positioned to show equal space on all sides

  Scenario: Queen remains visible when moving within bounding box
    Given the queen is at the center of the map
    And the camera is centered on the queen
    When the queen moves 50 pixels to the right
    And the queen moves 50 pixels down
    Then the camera should NOT move
    And the queen should remain visible in the viewport

  Scenario: Queen remains visible when moving outside bounding box
    Given the queen is at the center of the map
    And the camera is centered on the queen
    When the queen moves 400 pixels to the right
    Then the camera should follow the queen
    And the queen should remain centered in the viewport
    And the queen should NOT appear at the edge of the screen

  # ========================================
  # Scenario Group: Map Edge Handling
  # ========================================

  Scenario: Queen can reach top-left corner of map
    Given the queen is at position (1600, 1600) in world coordinates
    When I move the queen to position (0, 0)
    Then the queen should be visible at the top-left of the viewport
    And the camera should show the top-left corner of the map
    And the queen should be fully visible on screen

  Scenario: Queen can reach bottom-right corner of map
    Given the queen is at position (1600, 1600) in world coordinates
    When I move the queen to position (3140, 3140)
    Then the queen should be visible at the bottom-right of the viewport
    And the camera should show the bottom-right corner of the map
    And the queen should be fully visible on screen

  Scenario: Queen can reach all four map edges
    Given the queen is at the center of the map
    When I move the queen to the left edge at x=0
    Then the queen should be visible at the left edge of the viewport
    When I move the queen to the right edge at x=3140
    Then the queen should be visible at the right edge of the viewport
    When I move the queen to the top edge at y=0
    Then the queen should be visible at the top edge of the viewport
    When I move the queen to the bottom edge at y=3140
    Then the queen should be visible at the bottom edge of the viewport

  # ========================================
  # Scenario Group: No Camera Offset Bug
  # ========================================

  Scenario: No 78-pixel offset when queen at right edge
    Given the queen spawns at position (2848, 608) near the right edge
    When the custom level finishes loading
    Then the queen should be visible in the viewport
    And the queen should NOT be offset by 78 pixels from center
    And the camera should be positioned correctly relative to the queen

  Scenario: Camera centers properly regardless of spawn position
    Given the queen spawns at position (100, 100) near top-left
    Then the camera should position correctly
    Given the queen spawns at position (3000, 3000) near bottom-right
    Then the camera should position correctly
    Given the queen spawns at position (1600, 1600) at center
    Then the camera should position correctly

  # ========================================
  # Scenario Group: Camera State Transitions
  # ========================================

  Scenario: Camera switches to bounded mode when entering custom level
    Given I am on the main menu
    When I select "Load Custom Level"
    And I load "CaveTutorial.json"
    Then the camera should switch to custom level mode
    And the camera should use bounded follow algorithm
    And the queen should be centered in the viewport

  Scenario: Camera preserves state when returning to menu
    Given I am playing a custom level
    And the queen is at position (2000, 2000)
    And the camera is following the queen
    When I press ESC to return to menu
    And I resume the custom level
    Then the camera should return to the same position
    And the queen should still be visible

  # ========================================
  # Scenario Group: Arrow Key Behavior
  # ========================================

  Scenario: Arrow keys do NOT move camera in custom levels
    Given I am playing a custom level
    And the camera is centered on the queen
    When I press the RIGHT arrow key
    Then the camera should NOT move to the right
    And the camera should continue following the queen only

  Scenario: Arrow keys do NOT interfere with queen following
    Given I am playing a custom level
    And the queen is moving toward the right edge
    When I hold down the LEFT arrow key
    Then the camera should ignore the arrow key input
    And the camera should continue following the queen normally

  # ========================================
  # Scenario Group: Zoom Integration
  # ========================================

  Scenario: Camera adjusts bounding box when zooming in
    Given the queen is at the center of the map
    And the camera zoom is 1.0x
    When I zoom in to 2.0x
    Then the bounding box should become smaller in world coordinates
    And the queen should remain centered
    And the camera should follow the queen with the new bounding box size

  Scenario: Camera maintains follow behavior at different zoom levels
    Given the queen is at position (1600, 1600)
    When I set zoom to 0.5x
    And the queen moves 500 pixels right
    Then the camera should follow the queen
    When I set zoom to 2.0x
    And the queen moves 500 pixels left
    Then the camera should follow the queen

  # ========================================
  # Scenario Group: Procedural Level Compatibility
  # ========================================

  Scenario: Camera uses procedural mode for normal game
    Given I start a new game in procedural mode
    Then the camera should use the standard camera system
    And the camera should use edge-clamping algorithm
    And arrow keys should be enabled

  Scenario: Camera switches between procedural and custom modes
    Given I am playing in procedural mode
    When I exit to menu and load a custom level
    Then the camera should switch to bounded follow mode
    When I exit to menu and start a new procedural game
    Then the camera should switch back to edge-clamping mode

  # ========================================
  # Scenario Group: Performance & Edge Cases
  # ========================================

  Scenario: Camera maintains 60fps with bounded follow
    Given I am playing a custom level
    And the queen is moving continuously
    When I monitor the frame rate
    Then the game should maintain 60 frames per second
    And the camera updates should not cause lag

  Scenario: Camera handles small custom maps
    Given I load a custom level with a 600x400 pixel map
    When the level finishes loading
    Then the map should be centered in the viewport
    And the camera should not extend beyond the map bounds
    And the queen should be visible

  Scenario: Camera handles queen spawning at map edge
    Given I load a custom level where the queen spawns at x=3000, y=3000
    When the level finishes loading
    Then the queen should be visible in the viewport
    And the camera should be positioned at the map edge
    And the queen should be fully visible on screen
