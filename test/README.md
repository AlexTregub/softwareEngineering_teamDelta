# Test Suite Organization# 🚨 TESTING STANDARDS & DOCUMENTATION GUIDE 🚨



Welcome to the Ant Game test suite! Tests are organized by type following software testing best practices.> **⚠️ REQUIRED READING BEFORE WRITING ANY TESTS ⚠️**  

> **This guide points you to ALL testing documentation and standards**

---

## 📋 **MANDATORY DOCUMENTATION REVIEW**

## 📁 Test Structure

**Before writing or modifying any tests, you MUST review these documents:**

```

test/### 1. 🎯 **START HERE - Core Standards**

├── unit/          # Unit Tests - Fast, isolated tests of individual functions/classes

├── integration/   # Integration Tests - Tests of components working together  📍 **Location**: `../docs/standards/testing/`

├── e2e/          # End-to-End Tests - Full browser automation (Puppeteer)

├── bdd/          # BDD Tests - Behavior-driven development (Gherkin/Behave)| Document | Purpose | When to Use |

└── smoke/        # Smoke Tests - Quick sanity checks|----------|---------|-------------|

```| **[TESTING_METHODOLOGY_STANDARDS.md](../docs/standards/testing/TESTING_METHODOLOGY_STANDARDS.md)** | 🚫 RED FLAGS & ✅ STRONG patterns | Before writing ANY test |

| **[BDD_LANGUAGE_STYLE_GUIDE.md](../docs/standards/testing/BDD_LANGUAGE_STYLE_GUIDE.md)** | Clean, professional test language | For BDD feature files |

---| **[TESTING_QUICK_REFERENCE.md](../docs/standards/testing/TESTING_QUICK_REFERENCE.md)** | Fast lookup for weak patterns | During test review |



## 🧪 Test Types### 2. 🛠️ **Technical Implementation**



### Unit Tests (`test/unit/`)| Document | Purpose | When to Use |

- **Speed**: ⚡⚡⚡ Very Fast (milliseconds)|----------|---------|-------------|

- **Purpose**: Test individual functions, classes, methods in isolation| **[DEPENDENCY_MANAGEMENT_STRATEGY.md](../docs/standards/testing/DEPENDENCY_MANAGEMENT_STRATEGY.md)** | Smart dependency detection & validation | When mocking system APIs |

- **Tech**: JavaScript (Mocha/Chai)| **[TESTING_VALIDATION_PROCESS.md](../docs/standards/testing/TESTING_VALIDATION_PROCESS.md)** | Test quality validation process | During test reviews |



### End-to-End Tests (`test/e2e/`)---

- **Speed**: ⚡ Slower (seconds to minutes)

- **Purpose**: Test complete user workflows in real browser## 🗂️ **TEST FOLDER STRUCTURE OVERVIEW**

- **Tech**: Puppeteer (headless Chrome)

- **Run**: `npm run test:e2e`### **`/bdd_new/` - Behavior Driven Development Tests**



**Categories**: camera, spawn, combat, selection, ui- **🎯 Primary test suite using Selenium + behave (HEADLESS)**

- **Features**: `features/*.feature` - Gherkin scenarios

### BDD Tests (`test/bdd/`)- **Steps**: `steps/*.py` - Python step definitions  

- **Speed**: ⚡ Varies- **Runners**: `run_bdd_tests.py`, `quick_test.py` (both headless)

- **Purpose**: Define and test business requirements- **Analysis**: `run_dependency_analysis.py` - System API discovery (headless)

- **Tech**: Python Behave + Selenium

- **Run**: `npm run test:bdd`### **`/unit/` - Unit Tests (JavaScript)**



### Smoke Tests (`test/smoke/`)- **🔬 Individual component testing**

- **Speed**: ⚡⚡⚡ Very Fast- **Framework**: Mocha/Jest JavaScript tests

- **Purpose**: Quick sanity checks- **Focus**: Single class/function validation

- **Run**: `npm run test:smoke`- **Examples**: `button.test.js`, `resourceManager.test.js`



---### **`/integration/` - Integration Tests**



## 🚀 Quick Start- **🔗 Cross-component interaction testing**

- **Mix**: Python + JavaScript integration

```bash- **Focus**: Component interaction validation

npm test                    # Runs BDD suite (default)- **Includes**: Browser automation helpers

npm run test:e2e           # All E2E tests

npm run test:e2e:camera    # Just camera E2E tests---

npm run test:bdd           # BDD tests

npm run test:smoke         # Smoke tests## ⚡ **QUICK START CHECKLIST**

```

**Before writing a new test:**

---

- [ ] Read **TESTING_METHODOLOGY_STANDARDS.md** for RED FLAGS

## 📚 Full Documentation- [ ] Check **BDD_LANGUAGE_STYLE_GUIDE.md** for clean language

- [ ] Run dependency analysis if testing system APIs

See `docs/guides/TESTING_TYPES_GUIDE.md` for comprehensive testing guide.- [ ] Use **TESTING_QUICK_REFERENCE.md** during implementation


**Before submitting tests:**

- [ ] No RED FLAG patterns present
- [ ] Language follows style guide (no "real/fake" emphasis)
- [ ] Tests use system APIs, not test logic
- [ ] Realistic data and thresholds used

---

## 🚫 **CRITICAL RED FLAGS - IMMEDIATE REJECTION**

**These patterns will fail review instantly:**

### Language Anti-Patterns

- ❌ "**REAL** antsSpawn function" → ✅ "antsSpawn function"
- ❌ "**actual** game data" → ✅ "game data"  
- ❌ "**fake implementations**" → ✅ (remove entirely)
- ❌ "**authentic** testing" → ✅ "testing"

### Code Anti-Patterns

- ❌ `expect(counter).to.equal(5)` - Loop counter testing
- ❌ `expect(true).to.be.true` - Placeholder tests
- ❌ `obj._privateMethod()` - Private method testing
- ❌ Manual property injection without system constructor
- ❌ Hardcoded test results without execution

---

## 🎯 **TEST QUALITY STANDARDS**

**Every test must pass these 3 questions:**

1. **"Does this test use the system API?"** If no → weak test
2. **"Would this test catch a bug (assumning it's not a unit test)?"** If no → weak test  
3. **"Am I testing system behavior or test logic?"** If test logic → weak test

---

## �️ **BROWSER REQUIREMENTS**

**ALL tests run in HEADLESS mode:**

- ✅ **Chrome headless** - Primary browser for all automation
- ✅ **No GUI required** - Tests run without visible browser windows
- ✅ **CI/CD compatible** - Works on servers without display
- ✅ **Faster execution** - Headless mode is more efficient

> **⚠️ REQUIREMENT**: Chrome browser must be installed, but tests run headless

### ChromeDriver Management

**✅ Automatic Version Handling**: The test framework uses `webdriver-manager` to automatically download and manage the correct ChromeDriver version that matches your installed Chrome browser.

**No manual ChromeDriver installation required!** The framework automatically:

- Detects your Chrome browser version
- Downloads the compatible ChromeDriver
- Manages version updates when Chrome updates
- Eliminates version compatibility errors

---

## �🚀 **HOW TO RUN TESTS**

### BDD Tests (Recommended)

```bash
# Full BDD suite with headless browser automation
cd bdd_new
python run_bdd_tests.py

# Quick validation (headless)
python quick_test.py

# System dependency analysis (headless)
python run_dependency_analysis.py

# Verify headless browser setup
python verify_headless.py
```

> **🤖 All browser tests run in HEADLESS mode for CI/CD compatibility**

### Unit Tests

```bash
# JavaScript unit tests
cd unit
npm test

# Specific test file
node button.test.js
```

### Integration Tests

```bash
cd integration  
python run_integration_tests.py
```

---

## 📚 **COMPLETE DOCUMENTATION INDEX**

### Testing Standards (`../docs/standards/testing/`)

1. **TESTING_METHODOLOGY_STANDARDS.md** - Core methodology & RED FLAGS
2. **BDD_LANGUAGE_STYLE_GUIDE.md** - Professional test language  
3. **TESTING_QUICK_REFERENCE.md** - Fast lookup reference
4. **DEPENDENCY_MANAGEMENT_STRATEGY.md** - System API testing strategy
5. **TESTING_VALIDATION_PROCESS.md** - Quality validation process
6. **testing-methodology.md** - Historical methodology document

### Test Execution Files (this folder)

- **`bdd_new/run_bdd_tests.py`** - Primary BDD test runner
- **`bdd_new/quick_test.py`** - Fast validation runner  
- **`bdd_new/run_dependency_analysis.py`** - API discovery tool
- **`integration/run_integration_tests.py`** - Integration test runner
- **`unit/*.test.js`** - Individual unit tests

---

## ⚠️ **FAILURE TO FOLLOW THESE STANDARDS**

**Tests that violate these standards will be:**

- ❌ **Rejected in code review**
- ❌ **Marked as technical debt**
- ❌ **Required to be rewritten**

**This documentation exists to prevent:**

- 🚫 Weak tests that don't catch bugs
- 🚫 Inconsistent language and style
- 🚫 Tests that break when system changes
- 🚫 Time waste from rejected submissions

---

## 💡 **NEED HELP?**

1. **Start with**: TESTING_METHODOLOGY_STANDARDS.md RED FLAGS section
2. **Language questions**: BDD_LANGUAGE_STYLE_GUIDE.md examples
3. **Quick lookup**: TESTING_QUICK_REFERENCE.md patterns
4. **System APIs**: Run dependency analysis first
5. **Integration issues**: Check DEPENDENCY_MANAGEMENT_STRATEGY.md

**Remember**: Good tests save debugging time. Bad tests waste everyone's time.
**Follow the standards = faster reviews + fewer bugs + maintainable code.**
