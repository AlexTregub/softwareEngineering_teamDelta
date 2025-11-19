Feature: Game UI Overlay System
  As a player
  I want to see my faction's resources displayed on screen
  So that I can track my available resources during gameplay

  Background:
    Given the game is loaded
    And the game state is "PLAYING"

  Scenario: GameUIOverlay initializes and displays resources
    Given a GameUIOverlay is created with EventManager and RenderLayerManager
    When the overlay is initialized with faction "player"
    Then the ResourceDisplayComponent should be created
    And the component should be registered with RenderLayerManager on UI_GAME layer
    And the overlay should be marked as initialized

  Scenario: Resource display shows default values
    Given a GameUIOverlay is initialized with faction "player"
    When the game renders the UI_GAME layer
    Then the resource display should show 0 food
    And the resource display should show 0 wood
    And the resource display should show 0 stone

  Scenario: Resource display updates when RESOURCE_UPDATED event fires
    Given a GameUIOverlay is initialized with faction "player"
    When a RESOURCE_UPDATED event fires with food amount 100 for faction "player"
    And the game renders the UI_GAME layer
    Then the resource display should show 100 food

  Scenario: Resource display updates with multiple resources
    Given a GameUIOverlay is initialized with faction "player"
    When a RESOURCE_UPDATED event fires with food amount 150 for faction "player"
    And a RESOURCE_UPDATED event fires with wood amount 75 for faction "player"
    And a RESOURCE_UPDATED event fires with stone amount 50 for faction "player"
    And the game renders the UI_GAME layer
    Then the resource display should show 150 food
    And the resource display should show 75 wood
    And the resource display should show 50 stone

  Scenario: Resource display ignores events for different factions
    Given a GameUIOverlay is initialized with faction "player"
    When a RESOURCE_UPDATED event fires with food amount 500 for faction "enemy"
    And the game renders the UI_GAME layer
    Then the resource display should show 0 food

  Scenario: Multiple overlays display independently
    Given a GameUIOverlay is initialized with faction "player" at position 10, 10
    And a GameUIOverlay is initialized with faction "enemy" at position 600, 10
    When a RESOURCE_UPDATED event fires with food amount 100 for faction "player"
    And a RESOURCE_UPDATED event fires with food amount 200 for faction "enemy"
    And the game renders the UI_GAME layer
    Then the player overlay should show 100 food
    And the enemy overlay should show 200 food

  Scenario: Overlay cleans up on destroy
    Given a GameUIOverlay is initialized with faction "player"
    When the overlay is destroyed
    Then the overlay should be marked as not initialized
    And the components array should be empty
    And the ResourceDisplayComponent should be cleaned up

  Scenario: Overlay can be re-initialized after destroy
    Given a GameUIOverlay is initialized with faction "player"
    And the overlay is destroyed
    When the overlay is initialized with faction "player2"
    Then the overlay should be marked as initialized
    And the ResourceDisplayComponent should have faction "player2"

  Scenario: Overlay handles missing EventManager gracefully
    Given a GameUIOverlay is created without EventManager
    When the overlay is initialized with faction "player"
    Then the overlay should be marked as initialized
    And the ResourceDisplayComponent should be created

  Scenario: Overlay handles missing RenderLayerManager gracefully
    Given a GameUIOverlay is created without RenderLayerManager
    When the overlay is initialized with faction "player"
    Then the overlay should be marked as initialized
    And the ResourceDisplayComponent should be created

  Scenario: Rendering pipeline processes overlay drawables
    Given a GameUIOverlay is initialized with faction "player"
    When a RESOURCE_UPDATED event fires with food amount 250 for faction "player"
    And the RenderLayerManager renders all layers
    Then drawing functions should be called
    And the resource display should be visible on screen
