# 🎭 Shareholder Demo System

A comprehensive visual demonstration and testing system designed to showcase the ant simulation's technical capabilities to stakeholders while providing automated validation through Selenium BDD testing.

## 🎯 Overview

The Shareholder Demo System provides:

- **🎪 Automated Visual Demonstration**: Cycles through all system features automatically
- **🔍 BDD Testing**: Gherkin scenarios with Selenium validation
- **📊 Comprehensive Reporting**: HTML reports with screenshots and metrics
- **🎮 UI Integration**: Accessible via in-game demo button
- **🤖 Selenium Validation**: Automated visual and logical verification

## 🚀 Features

### Visual Demonstrations
- **Entity Cleanup**: Clears screen, stops spawners, hides UI panels
- **Highlight System**: Cycles through all available highlight types (SELECTED, HOVER, COMBAT, etc.)
- **Job System**: Demonstrates all job types with sprite and name updates
- **State Machine**: Shows all behavioral states with visual indicators
- **Performance Monitoring**: Tracks and reports system performance

### Testing Capabilities
- **BDD Scenarios**: Gherkin-style feature definitions
- **Selenium Automation**: WebDriver-based visual validation
- **Screenshot Capture**: Automatic screenshot generation for each phase
- **Error Handling**: Robust error detection and reporting
- **Adaptability**: Automatically detects new highlights, jobs, and states

## 🏗️ Architecture

```
ShareholderDemo System
├── ShareholderDemo.js          # Main demo framework
├── BDD Tests/
│   ├── shareholder-demo.feature # Gherkin scenarios
│   └── ShareholderDemoTests.js  # Selenium automation
├── UI Integration/
│   ├── Button configuration     # Demo button in UI
│   └── Event handling          # Click handlers
└── Reporting/
    ├── HTML report generation
    ├── Screenshot management
    └── Performance metrics
```

## 🎮 Usage

### In-Game Demo

1. **Launch the Game**: Ensure the game is running in `PLAYING` state
2. **Find Demo Button**: Look for the 🎭 Demo button (typically in top-right corner)
3. **Start Demo**: Click the demo button to begin automated demonstration
4. **Observe**: Watch as the system demonstrates all features automatically
5. **View Report**: Check console or localStorage for generated reports

### Automated Testing

#### Prerequisites

```bash
cd test/selenium
npm install
```

#### Run Tests

```bash
# Start local server and run tests
npm run test:full

# Or run individually
npm run test:serve  # Start HTTP server
npm run test:demo   # Run Selenium tests
```

## 📋 BDD Scenarios

### Environment Setup and Cleanup
- **Given**: Game is loaded and running
- **When**: Demo button is clicked
- **Then**: 
  - All entities cleared from screen
  - Spawning systems stopped
  - UI panels hidden (except demo controls)
  - Single test ant spawned at center

### Highlight System Demonstration
- **When**: Demo cycles through highlight types
- **Then**: Each highlight effect is visible and detectable
- **Validates**: SELECTED, HOVER, BOX_HOVERED, COMBAT, FRIENDLY, ENEMY, RESOURCE

### Job System Demonstration
- **When**: Demo cycles through job types
- **Then**: Ant sprite and job name update correctly
- **Validates**: Scout, Builder, Farmer, Warrior, Spitter, DeLozier

### State Machine Demonstration
- **When**: Demo cycles through behavioral states
- **Then**: State indicators appear with correct symbols
- **Validates**: MOVING, GATHERING, BUILDING, ATTACKING, FOLLOWING, FLEEING, IDLE

## 🔧 Configuration

### Demo Settings

```javascript
// In ShareholderDemo.js
this.phaseDuration = 2000; // 2 seconds per phase
this.timeout = 30000;      // 30 second timeout
```

### Selenium Settings

```javascript
// In ShareholderDemoTests.js
const options = {
  baseUrl: 'http://localhost:3000',
  timeout: 30000,
  screenshotDir: './test-screenshots'
};
```

## 📊 Reporting

### Demo Report Features
- **📈 Performance Metrics**: Frame rates, render times, entity counts
- **✅ Success Rates**: Step-by-step validation results
- **📸 Screenshots**: Visual documentation of each phase
- **🕒 Timing Data**: Duration and performance analysis
- **❌ Error Tracking**: Detailed error logs and context

### Report Locations
- **Browser**: localStorage (`shareholder-demo-{timestamp}`)
- **Selenium**: `./test-screenshots/selenium-test-report.html`
- **Console**: Real-time progress and summary logs

## 🛠️ API Reference

### ShareholderDemo Class

```javascript
// Start the demo
await shareholderDemo.startDemo();

// Get current status
const isRunning = shareholderDemo.isRunning();
const currentPhase = shareholderDemo.getCurrentPhase();
const progress = shareholderDemo.getProgress(); // 0-100%

// Get validation data
const highlightState = shareholderDemo.getCurrentHighlightState();
const currentJob = shareholderDemo.getCurrentJob();
const currentState = shareholderDemo.getCurrentState();
```

### Entity Validation Getters

```javascript
// For any entity
const validationData = entity.getValidationData();
const jobName = entity.getJobName();
const currentState = entity.getCurrentState();

// For ants specifically
const antData = ant.getAntValidationData();
const healthData = ant.getHealthData();
const resourceData = ant.getResourceData();
```

### RenderController Validation

```javascript
// Get render state
const renderData = renderController.getValidationData();
const highlightState = renderController.getHighlightState();
const availableHighlights = renderController.getAvailableHighlights();
const isHighlighted = renderController.isHighlighted();
```

## 🎯 Stakeholder Benefits

### For Management
- **Visual Proof of Concept**: See all features working together
- **Quality Assurance**: Automated testing validates functionality
- **Performance Metrics**: Real data on system performance
- **Progress Tracking**: Clear demonstration of technical achievements

### For Technical Teams
- **Regression Testing**: Automated validation catches issues early
- **Documentation**: Living documentation of system capabilities
- **Integration Testing**: Validates system-wide functionality
- **Performance Monitoring**: Identifies optimization opportunities

## 🔄 Extensibility

### Adding New Features

The system automatically adapts when you add:

#### New Highlight Types
```javascript
// In RenderController.js HIGHLIGHT_TYPES
NEW_HIGHLIGHT: {
  color: [255, 100, 0],
  strokeWeight: 2,
  style: "pulse"
}
```

#### New Job Types
```javascript
// In JobImages global
JobImages.NewJob = loadImage('path/to/new-job.png');
```

#### New States
```javascript
// In RenderController.js STATE_INDICATORS
NEW_STATE: { 
  color: [0, 200, 100], 
  symbol: "🆕" 
}
```

The demo will automatically include these in its cycles without code changes.

## 📝 Troubleshooting

### Common Issues

1. **Demo Button Not Visible**
   - Check game state is 'PLAYING'
   - Verify button group configuration loaded
   - Check console for initialization errors

2. **Selenium Tests Failing**
   - Ensure HTTP server is running on correct port
   - Check ChromeDriver version compatibility
   - Verify timeout settings for slower systems

3. **Screenshots Not Generated**
   - Check directory permissions
   - Verify screenshot directory exists
   - Ensure sufficient disk space

### Debug Mode

```javascript
// Enable debug logging
shareholderDemo.debugMode = true;

// Check system status
console.log('Demo available highlights:', shareholderDemo.availableHighlights);
console.log('Demo available jobs:', shareholderDemo.availableJobs);
console.log('Demo available states:', shareholderDemo.availableStates);
```

## 🤝 Contributing

When adding new features to the demo system:

1. **Update BDD Scenarios**: Add new test cases in `shareholder-demo.feature`
2. **Extend Selenium Tests**: Add validation logic in `ShareholderDemoTests.js`
3. **Add Getter Methods**: Ensure new features have validation getters
4. **Update Documentation**: Keep this README current with changes

## 📄 License

Part of the Software Engineering Team Delta project. See main project license for details.

---

*This demo system showcases the technical sophistication and attention to detail that defines our ant simulation project. It serves both as a powerful stakeholder presentation tool and as a comprehensive automated testing framework.*