Feature: Resource MVC System
  As a game developer
  I want to create and manage resources using the MVC pattern
  So that resources are properly encapsulated and testable

  Background:
    Given the game is loaded on localhost:8000
    And the game has started

  @resources @mvc @core
  Scenario: Create resources using ResourceFactory
    When I create a green leaf resource at grid position (10, 10)
    And I create a maple leaf resource at grid position (15, 10)
    And I create a stick resource at grid position (20, 10)
    And I create a stone resource at grid position (25, 10)
    Then 4 resources should exist in the game
    And the green leaf should be at grid position (10, 10)
    And the maple leaf should be at grid position (15, 10)
    And the stick should be at grid position (20, 10)
    And the stone should be at grid position (25, 10)

  @resources @mvc @api
  Scenario: Resource Controller provides correct API
    Given I create a green leaf resource at grid position (10, 10)
    When I query the resource properties
    Then the resource should have a getPosition method
    And the resource should have a getType method
    And the resource should have a getAmount method
    And the resource should have a gather method
    And the resource should have an isDepleted method
    And the resource type should be "Food"
    And the resource amount should be greater than 0

  @resources @mvc @gathering
  Scenario: Gathering resources reduces amount and triggers depletion
    Given I create a green leaf resource at grid position (10, 10) with amount 50
    When I gather 20 units from the resource
    Then the resource amount should be 30
    And the resource should not be depleted
    When I gather 30 units from the resource
    Then the resource amount should be 0
    And the resource should be depleted

  @resources @mvc @performance
  Scenario: Create multiple resources efficiently
    When I create 100 green leaf resources at random positions
    Then all 100 resources should be created within 1 second
    And each resource should have valid position coordinates
    And each resource should have a valid type

  @resources @mvc @integration
  Scenario: ResourceManager integrates with ResourceController
    Given I create a green leaf resource at grid position (10, 10)
    And I create a maple leaf resource at grid position (15, 10)
    And I create a stick resource at grid position (20, 10)
    When I query ResourceManager for food resources
    Then I should get 2 food resources
    When I query ResourceManager for wood resources
    Then I should get 1 wood resource

  @resources @mvc @deprecation
  Scenario: Old Resource class shows deprecation warning
    When I create a resource using the old Resource class
    Then a deprecation warning should appear in the console
    And the warning should mention ResourceFactory
    And the resource should still function correctly

  @resources @mvc @factory
  Scenario: ResourceFactory creates all resource types
    When I create a green leaf using ResourceFactory
    And I create a maple leaf using ResourceFactory
    And I create a stick using ResourceFactory
    And I create a stone using ResourceFactory
    Then all 4 resources should be ResourceController instances
    And each resource should have the MVC pattern methods

  @resources @mvc @rendering @last
  Scenario: Resources render correctly on the game canvas
    Given I create a green leaf resource at grid position (10, 10)
    And I create a maple leaf resource at grid position (15, 10)
    When the game renders one frame
    Then the green leaf sprite should be visible at position (10, 10)
    And the maple leaf sprite should be visible at position (15, 10)
    And a screenshot should show both resources
