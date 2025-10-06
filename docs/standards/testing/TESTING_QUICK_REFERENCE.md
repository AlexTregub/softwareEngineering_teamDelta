# Testing Standards Quick Reference

## 🚫 RED FLAGS - Weak Test Patterns

### Immediate Rejection Criteria:
- **Loop Counter Tests**: `expect(counter).to.equal(5)`
- **Basic Math Tests**: `expect(minValue).to.be.lessThan(maxValue)` 
- **Language Feature Tests**: Testing `.some()`, `.forEach()`, array methods
- **Arbitrary Thresholds**: Magic numbers not from system config
- **Manual Re-implementation**: Writing own logic instead of testing system APIs
- **Test Logic Validation**: Testing that tests work, not that system works
- **Private Method Testing**: `obj._privateMethod()` instead of public APIs
- **Trivial Setter Testing**: `setFlag(true)` → `expect(flag).to.be.true`
- **Manual State Manipulation**: `obj.createdAt = Date.now() - 100`
- **Increment Validation**: `expect(newValue).to.be.greaterThan(oldValue)`
- **Existence-Only Testing**: `expect(array.length).to.be.greaterThan(0)` without validating content
- **Property Structure Testing**: `expect(obj).to.have.property('x')` without checking values
- **Placeholder Tests**: `expect(true).to.be.true` - admits no real validation
- **Description Mismatches**: Test description doesn't match implementation
- **Missing Expectations**: Code execution without validation statements

## ✅ STRONG TEST PATTERNS

### Must-Have Elements:
1. **System API Usage**: `system.getWarnings()` not `array.some()`
2. **System Thresholds**: Use system's 50ms, not arbitrary 30ms  
3. **Business Logic**: Test requirements, not mechanics
4. **Positive + Negative**: Both "should detect" and "should not false alarm"
5. **Realistic Data**: Domain-appropriate test values
6. **Statistical Rigor**: Proper calculations for trend/pattern analysis
7. **🖥️ Headless Browsers**: ALL browser tests must run headless

## Quick Test Quality Check:

**Ask these 3 questions:**
1. **"Does this test use the real system API?"** If no → weak test
2. **"Would this test catch a real bug?"** If no → weak test  
3. **"Am I testing system behavior or test logic?"** If test logic → weak test

## Examples from Our Fixes:

### ❌ BEFORE (Weak):
```javascript
expect(memoryIncreases).to.equal(5); // Counting loops
expect(hasSpikes).to.be.true; // Testing .some() method  
expect(stats.minFPS).to.be.lessThan(stats.maxFPS); // Basic math
renderController._updateAnimations(); // Private method testing
renderController.setDebugMode(true); expect(_debugMode).to.be.true; // Trivial setter
effect.createdAt = Date.now() - 100; // Manual state manipulation
// NEW EntityRenderer weak patterns:
expect(entityRenderer.renderGroups.ANTS.length).to.be.greaterThan(0); // Existence-only
expect(entityRenderer.renderGroups).to.have.property('RESOURCES'); // Structure-only
expected(true).to.be.true; // Placeholder test
// Test says "no depth specified" but sets depth: 300 // Description mismatch
const isVisible = entityRenderer.isEntityInViewport(entity); // Missing expectation
```

### ✅ AFTER (Strong):
```javascript
expect(warnings).to.include('Memory usage increasing: Possible memory leak'); // Real API
expect(performanceMonitor.metrics.worstFrameTime).to.be.greaterThan(50); // Real threshold
expect(coefficientOfVariation).to.be.greaterThan(0.3); // Statistical analysis
```

## Running Tally: **Latest Achievement: 77/77 BDD tests passing + 5 New RED FLAGS Identified**

### Recent Success (October 2025): RenderController Enhancement
✅ **Implemented 4 missing animation methods** for advanced visual effects  
✅ **Fixed all private method testing** - now uses public APIs and behavioral validation  
✅ **Enhanced debug system** - comprehensive state reporting with performance metrics  
✅ **Animation support** - FLOAT_UP, BOUNCE_FADE, velocity-based movement, opacity/scale transitions  
✅ **Full test coverage** - 77 meaningful tests validating actual system capabilities

---
*Use this as a code review checklist. Any test matching red flag patterns should be rejected and rewritten using strong patterns.*