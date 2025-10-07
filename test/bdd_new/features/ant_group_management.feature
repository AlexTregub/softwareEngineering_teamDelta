Feature: Ant Group Management System
  As a game developer
  I want to assign ants to control groups and select them with hotkeys
  So that players can manage ant formations efficiently

  Background:
    Given the ant spawning system is loaded
    And the AntGroupManager system is available
    And the KeyboardInputController is available
    And the DraggablePanelManager is available
    And I have 10 ants spawned at random positions

  Scenario: Assign selected ants to control group 1 using Ctrl+1
    Given I have 3 ants selected
    When I press Ctrl+1 to assign group 1
    Then the 3 selected ants should be assigned to group 1
    And group 1 should contain 3 ants
    And the group display UI should show group 1 with count 3
    And the assigned ants should retain their selection state

  Scenario: Select control group 1 using key 1
    Given I have assigned 4 ants to group 1
    And no ants are currently selected
    When I press key 1 to select group 1
    Then all 4 ants in group 1 should be selected
    And the selection system should synchronize across all selection methods
    And the selected ants should be moveable by clicking

  Scenario: Toggle control group selection with repeated key press
    Given I have assigned 3 ants to group 2
    And group 2 ants are currently selected
    When I press key 2 again
    Then all ants in group 2 should be deselected
    And no ants should be selected
    And the group display should still show group 2 with count 3

  Scenario: Reassign ants to different control groups
    Given I have assigned 2 ants to group 1
    And I select those same 2 ants
    When I press Ctrl+3 to assign group 3
    Then the 2 ants should no longer be in group 1
    And the 2 ants should be assigned to group 3
    And group 1 should be empty
    And group 3 should contain 2 ants
    And the group display should update accordingly

  Scenario: Assign additional ants to existing group
    Given I have assigned 2 ants to group 4
    And I select 3 different ants
    When I press Ctrl+4 to assign group 4
    Then group 4 should contain all 5 ants
    And the previous 2 ants should remain in group 4
    And the group display should show group 4 with count 5

  Scenario: Remove ants from groups when they are destroyed
    Given I have assigned 3 ants to group 5
    When 1 ant from group 5 is destroyed
    Then group 5 should contain 2 ants
    And the destroyed ant should be removed from all groups
    And the group display should show group 5 with count 2

  Scenario: Group display panel shows all assigned groups
    Given I have assigned ants to groups 1, 3, 5, and 7
    When I view the group display panel
    Then the panel should show group 1 badge with ant count
    And the panel should show group 3 badge with ant count
    And the panel should show group 5 badge with ant count
    And the panel should show group 7 badge with ant count
    And empty groups should not be displayed
    And the panel should be positioned in the bottom-left corner

  Scenario: Group display panel visual feedback for active group
    Given I have assigned 4 ants to group 6
    When I press key 6 to select group 6
    Then the group 6 badge should be visually highlighted
    And other group badges should appear normal
    When I deselect all ants
    Then no group badges should be highlighted

  Scenario: Multiple control groups can be managed simultaneously
    Given I have assigned 2 ants to group 1
    And I have assigned 3 ants to group 2
    And I have assigned 1 ant to group 3
    When I press key 1 to select group 1
    Then only group 1 ants should be selected
    When I press key 2 to select group 2
    Then group 1 ants should be deselected
    And only group 2 ants should be selected
    And all groups should maintain their assignments

  Scenario: Group assignments persist across game sessions
    Given I have assigned 5 ants to group 8
    When I save the game state
    And I reload the game state
    Then group 8 should still contain the same 5 ants
    And pressing key 8 should select those ants
    And the group display should show group 8 correctly

  Scenario: Maximum group limit enforcement
    Given I have 9 groups already assigned (groups 1-9)
    And I select 2 ants
    When I try to assign to group 0 using Ctrl+0
    Then the assignment should fail gracefully
    And an error message should be logged
    And the ants should remain unassigned to group 0
    And existing group assignments should be unchanged

  Scenario: Keyboard input integration with game state
    Given the game is in PLAYING state
    And I have ants assigned to various groups
    When I press Ctrl+5 to assign group 5
    Then the group assignment should work normally
    When the game state changes to PAUSED
    And I press key 5 to select group 5
    Then the group selection should still work
    When the game state changes to MENU
    And I press key 5
    Then group selection should be disabled
    And no ants should be selected

  Scenario: Group management with existing selection systems
    Given I have 4 ants selected using mouse drag selection
    When I press Ctrl+7 to assign group 7
    Then all 4 drag-selected ants should be assigned to group 7
    And the selection synchronization should work correctly
    Given I have 2 ants selected using panel selection buttons
    When I press Ctrl+9 to assign group 9
    Then the panel-selected ants should be assigned to group 9
    And they should remain moveable by clicking

  Scenario: Group display panel drag functionality
    Given the group display panel is visible
    When I drag the group display panel to a new position
    Then the panel should move to the new position
    And the panel should remember its position
    And group functionality should continue to work normally
    And the panel should not interfere with ant selection

  Scenario: Performance with large number of ants and groups
    Given I have 100 ants spawned
    And I assign 10 ants to each group (1-9)
    When I rapidly switch between groups using keys 1-9
    Then each group selection should complete within 50ms
    And the UI should update smoothly
    And there should be no memory leaks
    And the selection synchronization should remain accurate

  Scenario Outline: All number keys work for group selection
    Given I have assigned 3 ants to group <group_number>
    When I press key <key> to select the group
    Then all 3 ants in group <group_number> should be selected
    And the group display should highlight group <group_number>

    Examples:
      | group_number | key |
      | 1           | 1   |
      | 2           | 2   |
      | 3           | 3   |
      | 4           | 4   |
      | 5           | 5   |
      | 6           | 6   |
      | 7           | 7   |
      | 8           | 8   |
      | 9           | 9   |

  Scenario Outline: All Ctrl+number keys work for group assignment
    Given I have 2 ants selected
    When I press Ctrl+<key> to assign group <group_number>
    Then the 2 ants should be assigned to group <group_number>
    And the group display should show group <group_number> with count 2

    Examples:
      | group_number | key |
      | 1           | 1   |
      | 2           | 2   |
      | 3           | 3   |
      | 4           | 4   |
      | 5           | 5   |
      | 6           | 6   |
      | 7           | 7   |
      | 8           | 8   |
      | 9           | 9   |