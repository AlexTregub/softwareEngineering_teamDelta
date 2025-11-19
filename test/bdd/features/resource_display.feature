Feature: Resource Display
  As a player
  I want to see my faction's resources on screen
  So that I can track what I have collected

  Background:
    Given the game is running in headless mode
    And the resource display component is initialized

  Scenario: Initial resource display shows zero counts
    When the player views the screen
    Then the resource display shows 0 food
    And the resource display shows 0 wood
    And the resource display shows 0 stone

  Scenario: Display updates when food is collected
    Given the resource display shows 10 food
    When 5 food is added
    Then the resource display shows 15 food

  Scenario: Display updates when wood is collected
    Given the resource display shows 20 wood
    When 10 wood is added
    Then the resource display shows 30 wood

  Scenario: Display updates when stone is collected
    Given the resource display shows 5 stone
    When 3 stone is added
    Then the resource display shows 8 stone

  Scenario: Display updates multiple resources at once
    Given the resource display shows 100 food
    And the resource display shows 50 wood
    And the resource display shows 25 stone
    When 50 food is added
    And 25 wood is added
    And 10 stone is added
    Then the resource display shows 150 food
    And the resource display shows 75 wood
    And the resource display shows 35 stone

  Scenario: Display formats large numbers with commas
    Given the resource display shows 999 food
    When 1 food is added
    Then the resource display text contains "1,000"

  Scenario: Display shows correct position
    Given the resource display is positioned at x=50 y=100
    When the position is queried
    Then the x coordinate is 50
    And the y coordinate is 100

  Scenario: Display position can be changed
    Given the resource display is positioned at x=50 y=100
    When the position is changed to x=200 y=300
    Then the x coordinate is 200
    And the y coordinate is 300

  Scenario: Display scales correctly
    Given the resource display has scale 1.0
    When the scale is changed to 1.5
    Then the scale is 1.5

  Scenario: Display accepts bulk resource updates
    When all resources are set to food=100 wood=200 stone=300
    Then the resource display shows 100 food
    And the resource display shows 200 wood
    And the resource display shows 300 stone
