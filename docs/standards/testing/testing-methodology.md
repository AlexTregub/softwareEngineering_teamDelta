# Testing Methodology - Software Engineering Team Delta

## Primary Testing Framework: Gherkin/Behave

**Effective Date:** October 3, 2025  
**Status:** ACTIVE - All new tests must follow this methodology  
**Previous:** BDD Unit Tests (DEPRECATED - Convert existing tests to Gherkin)

## Overview

We use **Gherkin syntax with Behave framework** for all testing. This approach focuses on user scenarios and business requirements rather than technical implementation details.

## Testing Principles

### 1. User-Centric Testing

- Tests describe actual user workflows and scenarios
- Focus on "What the user wants to accomplish" not "How the code works"
- Use business language that stakeholders can understand

### 2. Behavior-Driven Development (BDD) with Gherkin

- **Feature files** (`.feature`) describe user stories and acceptance criteria
- **Step definitions** implement the actual test logic
- **Scenarios** represent specific use cases within features

### 3. Testing Structure

```mermaid
test/
├── behavioral/
│   ├── features/           # Gherkin feature files
│   │   ├── ui_management.feature
│   │   ├── entity_lifecycle.feature
│   │   └── button_interactions.feature
│   ├── steps/              # Step definition implementations
│   │   ├── ui_steps.js
│   │   ├── entity_steps.js
│   │   └── button_steps.js
│   └── support/            # Test helpers and configuration
│       ├── world.js
│       └── hooks.js
```

## Gherkin Feature File Format

### Standard Template

```gherkin
Feature: [Feature Name]
  As a [user type]
  I want [functionality]
  So that [business value]

  Background:
    Given [common setup for all scenarios]
    And [additional setup if needed]

  Scenario: [Scenario description]
    Given [initial state]
    When [user action]
    And [additional actions]
    Then [expected outcome]
    And [additional validations]

  Scenario Outline: [Template scenario with examples]
    Given [parameterized setup with <parameter>]
    When [action with <parameter>]
    Then [outcome with <parameter>]
    
    Examples:
      | parameter | expected_result |
      | value1    | result1        |
      | value2    | result2        |
```

### Example: Button Group Management

```gherkin
Feature: Universal Button Group System
  As a UI developer
  I want to create and manage groups of interactive buttons
  So that I can build consistent user interfaces efficiently

  Background:
    Given I have a button group configuration
    And I have an action factory for button behaviors

  Scenario: Creating a basic button group
    Given I have a horizontal layout configuration
    When I create a button group with 3 buttons
    And I set the position to center screen
    Then the buttons should be arranged horizontally
    And each button should be clickable
    And the group should be visible on screen

  Scenario: Dragging a button group
    Given I have a draggable button group at position (100, 100)
    When I click and hold on the button group
    And I move the mouse to position (200, 150)
    And I release the mouse
    Then the button group should move to position (200, 150)
    And the new position should be persisted to storage
```

## Step Definition Guidelines

### 1. Reusable Steps

Write steps that can be shared across multiple features:

```javascript
// Good: Reusable across features
Given('I have a {string} layout configuration', function(layoutType) {
  this.config = createLayoutConfig(layoutType);
});

// Avoid: Too specific to one scenario
Given('I have a horizontal button group with 3 blue buttons', function() {
  // Too specific - hard to reuse
});
```

### 2. Clear State Management

Use the World object to maintain test state between steps:

```javascript
// steps/ui_steps.js
const { Given, When, Then } = require('@cucumber/cucumber');

Given('I have a button group configuration', function() {
  this.config = {
    layout: { type: 'horizontal' },
    buttons: []
  };
});

When('I create a button group with {int} buttons', function(buttonCount) {
  this.buttonGroup = new ButtonGroup(this.config, this.actionFactory);
  // Add buttons...
});

Then('the buttons should be arranged horizontally', function() {
  const positions = this.buttonGroup.getButtonPositions();
  // Validate horizontal arrangement...
});
```

### 3. Assertion Patterns

Focus on user-observable outcomes, not internal implementation:

```javascript
// Good: Tests user-observable behavior
Then('the button group should be visible on screen', function() {
  assert(this.buttonGroup.isVisible());
  assert(this.buttonGroup.getBounds().width > 0);
});

// Avoid: Tests internal implementation details
Then('the ButtonGroup.state.visible property should be true', function() {
  assert(this.buttonGroup.state.visible === true); // Too implementation-specific
});
```

## Deprecated Patterns (Do Not Use)

### ❌ Technical BDD Unit Tests

```javascript
// OLD STYLE - Do not use
testSuite.test("ButtonGroup constructor should validate configuration object", () => {
  const config = { invalid: true };
  testSuite.assertThrows(() => new ButtonGroup(config));
});
```

### ❌ Method-Level Testing

```javascript
// OLD STYLE - Do not use  
testSuite.test("calculatePosition() should return correct x,y coordinates", () => {
  const result = buttonGroup.calculatePosition('center', 'top');
  testSuite.assertEqual(result.x, 600);
});
```

## Test Execution

### Running All Tests

```bash
npm run test:behave
# or
npx cucumber-js test/behavioral/features/
```

### Running Specific Features

```bash
npx cucumber-js test/behavioral/features/ui_management.feature
```

### Running with Tags

```gherkin
@ui @critical
Scenario: Critical button interaction
  # scenario content
```

```bash
npx cucumber-js --tags "@ui and @critical"
```

## Quality Standards

### 1. Scenario Independence

Each scenario should be completely independent and runnable in any order.

### 2. Clear Given-When-Then Structure

- **Given**: Set up the initial state (data, configuration, context)
- **When**: Perform the action being tested (user interaction, system event)
- **Then**: Verify the expected outcome (what changed, what's visible)

### 3. User Language

Write scenarios using language that end users and business stakeholders would understand.

### 4. Comprehensive Coverage

Each feature should cover:

- Happy path scenarios (normal successful usage)
- Edge cases (boundary conditions, empty states)
- Error scenarios (invalid input, system failures)
- Integration scenarios (multiple systems working together)

## Migration from Old Tests

### Conversion Process

1. **Identify user scenarios** from existing technical tests
2. **Group related tests** into logical features
3. **Rewrite using Gherkin syntax** focusing on user goals
4. **Implement step definitions** that execute the actual test logic
5. **Remove old BDD unit test files** once converted

### Example Conversion

```javascript
// OLD: Technical unit test
testSuite.test("handleDragging should update position during active drag", () => {
  buttonGroup.handleDragging(startX, startY, true);
  buttonGroup.handleDragging(newX, newY, true);
  testSuite.assertEqual(buttonGroup.state.position.x, expectedX);
});
```

```gherkin
# NEW: User-focused Gherkin scenario
Scenario: User drags button group to new position
  Given I have a button group at position (100, 100)
  When I drag the button group to position (200, 150)
  Then the button group should move to the new position
  And the position should be saved for next session
```

## Tools and Dependencies

```json
{
  "devDependencies": {
    "@cucumber/cucumber": "^9.5.0",
    "chai": "^4.3.0"
  }
}
```

## Conclusion

This methodology ensures our tests:

- Focus on user value and business requirements
- Are readable by both technical and non-technical team members
- Provide living documentation of system behavior
- Support continuous integration and automated testing
- Enable behavior-driven development practices

All new features must include Gherkin scenarios. Existing technical unit tests should be converted during refactoring or when adding new functionality to those areas.
