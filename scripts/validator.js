// Script Loader Validation and Setup
// Validates all script paths and provides teammate-friendly setup

class LoaderValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.missingFiles = [];
  }

  // Validate all script paths exist
  async validatePaths() {
    console.log('🔍 Validating script paths...');
    
    const config = window.SCRIPT_CONFIG || SCRIPT_CONFIG;
    const allScripts = [];
    
    // Collect all scripts from all groups
    Object.values(config.scriptGroups).forEach(group => {
      allScripts.push(...group.scripts);
    });
    
    // Test each script path
    for (const scriptPath of allScripts) {
      try {
        const response = await fetch(scriptPath, { method: 'HEAD' });
        if (!response.ok) {
          this.missingFiles.push(scriptPath);
          this.errors.push(`❌ Missing file: ${scriptPath} (${response.status})`);
        } else {
          console.log(`✓ Found: ${scriptPath}`);
        }
      } catch (error) {
        this.missingFiles.push(scriptPath);
        this.errors.push(`❌ Cannot access: ${scriptPath} (${error.message})`);
      }
    }
    
    return this.errors.length === 0;
  }

  // Check environment compatibility
  validateEnvironment() {
    console.log('🌍 Checking environment compatibility...');
    
    // Check for required browser features
    const requiredFeatures = {
      'fetch': typeof fetch !== 'undefined',
      'Promise': typeof Promise !== 'undefined',
      'async/await': (async () => {})().constructor === Promise,
      'ES6 classes': typeof class {} === 'function',
      'localStorage': typeof localStorage !== 'undefined'
    };
    
    Object.entries(requiredFeatures).forEach(([feature, supported]) => {
      if (supported) {
        console.log(`✓ ${feature} supported`);
      } else {
        this.errors.push(`❌ ${feature} not supported`);
      }
    });
    
    // Check URL compatibility
    if (window.location.protocol === 'file:') {
      this.warnings.push('⚠️  Running from file:// protocol may cause CORS issues');
      this.warnings.push('💡 Recommend using a local server (python -m http.server)');
    }
    
    return this.errors.length === 0;
  }

  // Generate teammate setup instructions
  generateSetupInstructions() {
    const instructions = `
🚀 TEAMMATE SETUP INSTRUCTIONS
==============================

1. **Prerequisites:**
   - Modern browser (Chrome 60+, Firefox 55+, Safari 12+)
   - Local web server (recommended)

2. **Quick Start:**
   - Clone the repository
   - Navigate to project folder
   - Run: python -m http.server 8000
   - Open: http://localhost:8000

3. **Environment Modes:**
   - Production: http://localhost:8000
   - Development: http://localhost:8000 (auto-detected on localhost)
   - Test Mode: http://localhost:8000?test=true

4. **Troubleshooting:**
   - If files won't load: Check console for errors
   - If CORS errors: Use local server, not file://
   - If scripts fail: Run validateSetup() in console

5. **Development Tools:**
   - listScripts() - Show loaded scripts
   - analyzeLoading() - Performance info
   - switchEnv("test") - Change environment

6. **File Structure Requirements:**
   All these paths must exist:
   ${this.getRequiredPaths().map(path => `   - ${path}`).join('\n')}
`;
    
    return instructions;
  }

  // Get all required file paths
  getRequiredPaths() {
    const config = window.SCRIPT_CONFIG || SCRIPT_CONFIG;
    const paths = [];
    
    Object.values(config.scriptGroups).forEach(group => {
      paths.push(...group.scripts);
    });
    
    return [...new Set(paths)].sort();
  }

  // Main validation function
  async validate() {
    console.log('🔧 Running teammate compatibility check...');
    
    const envValid = this.validateEnvironment();
    const pathsValid = await this.validatePaths();
    
    console.log('\n📊 VALIDATION RESULTS');
    console.log('='.repeat(30));
    
    if (this.errors.length === 0) {
      console.log('✅ All checks passed! Ready for teammates.');
    } else {
      console.log(`❌ Found ${this.errors.length} error(s):`);
      this.errors.forEach(error => console.log(`  ${error}`));
    }
    
    if (this.warnings.length > 0) {
      console.log(`\n⚠️  ${this.warnings.length} warning(s):`);
      this.warnings.forEach(warning => console.log(`  ${warning}`));
    }
    
    if (this.missingFiles.length > 0) {
      console.log('\n📁 Missing files that teammates will need:');
      this.missingFiles.forEach(file => console.log(`  - ${file}`));
    }
    
    console.log('\n' + this.generateSetupInstructions());
    
    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      missingFiles: this.missingFiles
    };
  }

  // Create a setup checklist file for teammates
  generateTeammateChecklist() {
    const checklist = `# Ant Game Setup Checklist

## ✅ Pre-Setup Verification

- [ ] Clone repository successfully
- [ ] All files present (run \`validateSetup()\` in browser console)
- [ ] Modern browser available (Chrome 60+, Firefox 55+, Safari 12+)
- [ ] Python or Node.js installed for local server

## 🚀 Setup Steps

1. **Start Local Server:**
   \`\`\`bash
   # Option 1: Python
   python -m http.server 8000
   
   # Option 2: Node.js
   npx serve -l 8000
   \`\`\`

2. **Open Game:**
   - Production: http://localhost:8000
   - Development: http://localhost:8000 (auto-detected)
   - Test Mode: http://localhost:8000?test=true

3. **Verify Loading:**
   - Check browser console for "🎉 All scripts loaded successfully"
   - No red error messages
   - Progress bar completes

## 🔧 Troubleshooting

### Common Issues:
- **CORS Errors:** Use local server, not file:// protocol
- **404 Errors:** Check file paths in browser console
- **Loading Hangs:** Check console for failed script loads

### Debug Commands:
\`\`\`javascript
// In browser console:
validateSetup()        // Check all file paths
listScripts()         // Show loaded scripts
analyzeLoading()      // Performance info
switchEnv("test")     // Switch to test mode
\`\`\`

## 📁 Required Files

${this.getRequiredPaths().map(path => `- ${path}`).join('\n')}

## 🆘 Getting Help

1. Check browser console for error messages
2. Run \`validateSetup()\` to diagnose issues
3. Verify all files are present in repository
4. Contact team lead if issues persist
`;

    return checklist;
  }
}

// Make validator globally available
window.LoaderValidator = LoaderValidator;
window.validateSetup = async () => {
  const validator = new LoaderValidator();
  return await validator.validate();
};

// Auto-run basic validation in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  console.log('🔧 Development environment detected - running basic validation...');
  setTimeout(async () => {
    const validator = new LoaderValidator();
    const envOk = validator.validateEnvironment();
    if (!envOk) {
      console.warn('⚠️  Environment issues detected. Run validateSetup() for details.');
    }
  }, 1000);
}

console.log('🛠️  Teammate compatibility tools loaded. Run validateSetup() to check everything.');