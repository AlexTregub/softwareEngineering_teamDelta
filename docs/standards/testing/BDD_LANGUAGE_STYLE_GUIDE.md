# BDD Test Language Style Guide

## Purpose

This guide ensures consistent, professional language in BDD test files without unnecessary emphasis on implementation details.

## ✅ PREFERRED Language

### Feature Descriptions

```gherkin
# ✅ Clean and direct
Feature: Ant Creation and Properties
Feature: Job System Management
Feature: System Dependencies Validation
Feature: Component Integration Testing
```

### Scenario Titles

```gherkin
# ✅ Functional focus
Scenario: Single ant spawns using antsSpawn function
Scenario: Multiple ants spawn via system
Scenario: Job system provides management APIs
Scenario: Dependencies are available
```

### Step Definitions

```gherkin
# ✅ Clear and straightforward
Given the antsSpawn function is available
When I call antsSpawn with 1 ant
Then the ants array should contain 1 ant
And the spawned ant should use the ant constructor
```

## ❌ AVOID Emphasis Language

### Don't Use These Patterns

- ~~"**REAL** antsSpawn function"~~ → `antsSpawn function`
- ~~"**actual** ant constructor"~~ → `ant constructor`  
- ~~"**genuine** system behavior"~~ → `system behavior`
- ~~"**authentic** testing"~~ → `testing`
- ~~"instead of **fake implementations**"~~ → (remove entirely)

### Anti-Patterns to Avoid

```gherkin
# ❌ Unnecessary emphasis
Feature: Ant Creation Using Real System APIs
Scenario: Single ant spawns using real antsSpawn function  
Given the real antsSpawn function is available
Then the real ants array should contain actual ant objects
```

## Code Comments and Docstrings

### ✅ GOOD

```python
"""Call the antsSpawn function from the game system"""
"""Verify spawned ants use the ant constructor"""  
"""Test JobComponent.getAllJobs() method"""
```

### ❌ AVOID

```python
"""Call the REAL antsSpawn function from the actual game system"""
"""Verify spawned ants use the actual ant constructor - NO FAKE OBJECTS"""
"""Test REAL JobComponent.getAllJobs() method - NO FAKE DATA"""
```

## Why This Matters

1. **Professional Appearance**: Clean language looks more professional
2. **Future Maintenance**: Simple descriptions age better
3. **Focus on Function**: Tests describe what they validate, not what they avoid
4. **Readability**: Straightforward language is easier to understand
5. **Consistency**: Uniform style across all test files

## Browser Configuration Requirements

**ALL browser tests MUST use headless mode:**

```python
# ✅ REQUIRED - Headless browser setup
chrome_options = Options()
chrome_options.add_argument('--headless=new')
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-gpu')
```

## Implementation Checklist

When writing new tests:

- [ ] Feature title is descriptive without qualifiers
- [ ] Scenario names focus on functionality
- [ ] Steps use clean, direct language
- [ ] Comments avoid emphasis words
- [ ] No contrast with "fake" approaches
- [ ] **Browser tests configured for headless mode**

When reviewing tests:

- [ ] Look for "real", "actual", "authentic", "genuine"
- [ ] Check for "fake", "mock", "simulated" references
- [ ] Ensure descriptions focus on behavior, not implementation
- [ ] Verify professional tone throughout
- [ ] **Confirm headless browser configuration**

## Quick Reference

**Replace these patterns:**

- "real/actual/authentic" → (remove qualifier)
- "fake/mock/simulated" → (remove entirely)  
- "genuine system" → "system"
- "instead of X" → (remove comparison)

**Keep focus on:**

- What the test validates
- Expected system behavior  
- Clear functional descriptions
- Professional terminology
