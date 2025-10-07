Feature: Universal Button Group System
  As a UI developer
  I want to create and manage groups of interactive buttons
  So that I can build consistent user interfaces efficiently

  Background:
    Given I have a button group configuration system
    And I have an action factory for button behaviors
    And I have a clean localStorage state

  Scenario: Creating a basic horizontal button group
    Given I have a horizontal layout configuration with 2 buttons
    When I create a button group at center screen position
    Then the button group should be visible and interactive
    And the buttons should be arranged horizontally with proper spacing
    And each button should be clickable and respond to mouse interactions
    And the group should have the correct bounding box dimensions

  Scenario: Creating a vertical button group with custom positioning
    Given I have a vertical layout configuration with 3 buttons
    And I set the position to top-left with padding
    When I create the button group
    Then the buttons should be arranged vertically
    And the group should be positioned at the top-left corner
    And the padding should create proper spacing around the buttons

  Scenario: Creating a grid layout button group
    Given I have a grid layout configuration with 6 buttons in 2 columns
    When I create the button group at bottom-right position
    Then the buttons should be arranged in a 2x3 grid pattern
    And the group should be positioned at the bottom-right corner
    And each button should maintain consistent sizing within the grid

  Scenario: Button group state management
    Given I have a button group with default visibility and transparency
    When I set the transparency to 0.5
    And I set the scale to 1.2
    Then the button group should be semi-transparent
    And the button group should be scaled to 120% size
    And the visual changes should be applied to all buttons in the group

  Scenario: Button group visibility control
    Given I have a visible button group
    When I set the group to invisible
    Then the button group should not be visible on screen
    And mouse interactions should not affect the invisible group
    When I set the group back to visible
    Then the button group should reappear with all original properties

  Scenario: Button group position persistence
    Given I have a draggable button group with persistence enabled
    And the storage key is "test-persistence-group"
    When I move the button group to position (150, 200)
    And I trigger state saving
    Then the position should be saved to localStorage
    And the saved data should contain the correct position coordinates

  Scenario: Loading persisted button group state
    Given I have saved button group state in localStorage
    And the saved state contains position (100, 150), scale 0.8, and transparency 0.7
    When I create a new button group with the same storage key
    Then the button group should load the persisted position
    And the button group should have the saved scale factor
    And the button group should have the saved transparency level

  Scenario: Button group state persistence with invalid data
    Given I have corrupted data in localStorage for a button group
    When I create a button group that tries to load the corrupted state
    Then the button group should use default values instead of corrupted data
    And the system should handle the error gracefully without crashing
    And a new valid state should be established

  Scenario: User drags button group to new position
    Given I have a draggable button group at position (100, 100)
    When I click and hold on the button group
    And I move the mouse to position (200, 150)
    And I release the mouse button
    Then the button group should move to the new position
    And the drag operation should update the group's internal position state
    And the new position should be saved automatically if persistence is enabled

  Scenario: Button group drag interaction outside bounds
    Given I have a draggable button group
    When I click outside the button group boundaries
    Then the drag operation should not initiate
    And the button group should remain in its original position
    And no drag state should be activated

  Scenario: Button group drag with snap-to-edges enabled
    Given I have a draggable button group with snap-to-edges enabled
    When I drag the button group close to the left screen edge
    And I release the mouse button
    Then the button group should snap to the exact left edge position
    And the snapped position should be persisted

  Scenario: Button group drag constraints without snap-to-edges
    Given I have a draggable button group with snap-to-edges disabled
    When I drag the button group near screen edges
    Then the button group should maintain the exact drag position
    And no automatic position adjustment should occur

  Scenario: Multiple consecutive drag operations
    Given I have a draggable button group at position (50, 50)
    When I drag it to position (100, 75)
    And I drag it again to position (175, 125)
    Then the final position should be (175, 125)
    And each drag operation should be independent
    And the position history should reflect all movements

  Scenario: Button group with empty button configuration
    Given I have a button group configuration with no buttons
    When I attempt to create the button group
    Then the button group should handle the empty state gracefully
    And the bounding box should reflect zero dimensions
    And no interactive elements should be present

  Scenario: Button group update cycle integration
    Given I have a button group with multiple buttons
    When I call the update method with mouse coordinates and click state
    Then all buttons in the group should receive update calls
    And drag handling should be processed if enabled
    And the group should maintain consistent state across the update cycle

  Scenario: Button group render integration
    Given I have a visible button group with styled buttons
    When the render method is called
    Then the group background should be drawn with correct styling
    And each button should be rendered in its calculated position
    And visual effects like transparency and scaling should be applied

  Scenario: Button group bounds calculation accuracy
    Given I have a button group with varied button sizes and padding
    When I request the group's bounding rectangle
    Then the bounds should encompass all buttons including padding
    And the bounds should account for the current scale factor
    And the bounds should reflect the rendered dimensions

  Scenario: Button group mouse interaction detection
    Given I have a button group with specific bounds
    When I test various mouse positions for interaction
    Then points inside the bounds should register as interactive
    And points outside the bounds should not register as interactive
    And boundary edge cases should be handled correctly