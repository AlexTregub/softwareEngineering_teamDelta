Feature: Core Game Systems
  As a game developer
  I want to test core game systems functionality
  So that I can ensure the game works correctly

  Background:
    Given the game engine is initialized
    And all core systems are loaded
    And the canvas is properly sized

  @ant-management
  Scenario: Ant spawning and lifecycle management
    Given the ant management system is active
    When I spawn 10 ants with random positions
    Then all 10 ants should be created successfully
    And each ant should have valid position coordinates
    And each ant should have a proper lifecycle state
    And the ant manager should track all spawned ants

  @ant-management
  Scenario: Ant job assignment and behavior
    Given I have spawned ants in the game
    When I assign jobs to the ants
    Then each ant should receive an appropriate job
    And the ant should display the correct job sprite
    And the ant behavior should match the assigned job type

  @collision-detection
  Scenario: CollisionBox2D system validation
    Given I have entities with collision boxes
    When I check for collisions between overlapping entities
    Then the collision system should detect overlaps correctly
    And non-overlapping entities should not register collisions
    And collision boundaries should be accurately calculated

  @movement-system
  Scenario: Entity movement controller functionality
    Given I have moveable entities in the game
    When I update entity positions through the movement controller
    Then entities should move smoothly to their target positions
    And movement should respect collision boundaries
    And pathfinding should navigate around obstacles

  @task-management
  Scenario: Task manager coordination
    Given the task management system is running
    When ants receive movement and collection tasks
    Then tasks should be queued and executed in proper order
    And completed tasks should be removed from the queue
    And task priorities should be respected

  @resource-management
  Scenario: Resource collection and management
    Given resources are spawned in the game world
    When ants attempt to collect resources
    Then resources should be properly collected and tracked
    And the resource manager should update inventory counts
    And collected resources should be removed from the world

  @state-machine
  Scenario: Ant state machine transitions
    Given ants with different behavioral states
    When conditions trigger state changes
    Then ants should transition between states correctly
    And state-specific behaviors should activate appropriately
    And invalid state transitions should be prevented