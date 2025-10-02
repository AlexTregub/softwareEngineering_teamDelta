Feature: Entity Lifecycle Management
  As a game developer  
  I want entities to be automatically collected and rendered by the system
  So that I don't have to manually manage entity rendering

  Background:
    Given I have an entity renderer
    And I have a mock entity system

  Scenario: New entity gets collected automatically
    Given I create a new entity with type "ant"
    When I assign a sprite with image "ant.png" at position (100, 150)
    And I set the render layer to "ANTS"
    Then the entity should be discoverable by the renderer
    And the entity should render when the "ANTS" layer is processed
    And the sprite render method should be called

  Scenario: Resource entity collection
    Given I create a new entity with type "resource"
    When I assign a sprite with image "leaf.png" at position (200, 250)
    And I set the render layer to "RESOURCES"
    Then the entity should be discoverable by the renderer
    And the entity should render when the "RESOURCES" layer is processed

  Scenario: Inactive entities are filtered out
    Given I create a new entity with type "ant"
    And I assign a sprite with image "ant.png" at position (100, 150)
    And I set the render layer to "ANTS"
    When I set the entity to inactive
    Then the entity should not be discoverable by the renderer
    And the sprite render method should not be called

  Scenario: Entities outside viewport are culled
    Given I create a new entity with type "ant"
    And I assign a sprite with image "ant.png" at position (-100, -100)
    And I set the render layer to "ANTS"
    And frustum culling is enabled
    Then the entity should not be discoverable by the renderer
    And the sprite render method should not be called