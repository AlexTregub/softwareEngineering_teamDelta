Feature: Comprehensive Action System Testing - Public API Validation
  As a game developer
  I want to ensure all action types and handlers work correctly
  So that user interactions produce the intended game responses

  Background:
    Given I have opened the game application in a browser
    And the GameActionFactory has been initialized with all handlers

  Scenario: Debug action complete workflow validation
    Given the UI_DEBUG layer is currently enabled
    When I execute the debug.toggleGrid action
    Then the action should return success: true
    And the UI_DEBUG layer should be disabled
    And debug elements should be hidden from view
    When I execute the debug.toggleGrid action again
    Then the UI_DEBUG layer should be enabled
    And debug elements should be visible again

  Scenario: Action handler registration verification
    Given the GameActionFactory is initialized
    When I inspect the available action handlers
    Then the debug handler should be registered and functional
    And each handler should have proper error handling
    And invalid handlers should be handled gracefully

  Scenario: Action execution with gameContext parameter
    Given I have actions that use game context
    When I execute actions with various context states
    Then the context should be passed correctly to handlers
    And handlers should be able to access context properties
    And context modifications should be isolated per action

  Scenario: Action result validation and feedback
    Given I have actions with different result types
    When I execute various actions
    Then each action should return a consistent result format
    And success/failure states should be clearly indicated
    And error messages should be descriptive and actionable

  Scenario: Concurrent action execution handling
    Given I have multiple actions that can run simultaneously
    When I trigger multiple actions at the same time
    Then each action should complete independently
    And no race conditions should occur
    And system state should remain consistent

  Scenario: Action parameter validation and sanitization
    Given I have actions that accept parameters
    When I pass various parameter types and values
    Then parameters should be validated before use
    And invalid parameters should be rejected safely
    And parameter sanitization should prevent injection attacks

  Scenario: Action execution timing and performance
    Given I have actions with different complexity levels
    When I measure action execution times
    Then simple actions should complete quickly
    And complex actions should not block the UI
    And performance should be consistent across executions

  Scenario: Action handler error propagation
    Given I have actions that may encounter errors
    When handlers throw exceptions or return errors
    Then errors should be caught and handled gracefully
    And error information should be logged appropriately
    And the system should remain stable after errors

  Scenario: Custom action registration and execution
    Given I want to register new action handlers
    When I add custom handlers to the GameActionFactory
    Then the new handlers should be available for execution
    And custom handlers should integrate with existing system
    And custom actions should follow the same patterns

  Scenario: Action execution monitoring and debugging
    Given I need to monitor action execution for debugging
    When actions are executed with monitoring enabled
    Then execution details should be captured
    And performance metrics should be available
    And debugging information should be accessible

  Scenario: Action batch execution and transactions
    Given I have multiple related actions
    When I execute actions as a batch
    Then all actions should succeed or none should execute
    And batch execution should maintain atomicity
    And rollback should be possible if any action fails

  Scenario: Action execution with external dependencies
    Given I have actions that depend on external systems
    When external systems are available
    Then actions should execute normally
    When external systems are unavailable
    Then actions should handle unavailability gracefully

  Scenario: Action history and replay capabilities
    Given I have actions with history tracking
    When I execute various actions
    Then action history should be maintained
    And actions should be replayable from history
    And replay should produce consistent results

  Scenario: Action execution security and validation
    Given I have actions that modify system state
    When I execute actions with various permissions
    Then permission checks should be enforced
    And unauthorized actions should be blocked
    And security violations should be logged

  Scenario: Action system integration with other components
    Given I have actions that interact with multiple systems
    When actions modify state across systems
    Then all system interactions should work correctly
    And state synchronization should be maintained
    And integration points should be robust