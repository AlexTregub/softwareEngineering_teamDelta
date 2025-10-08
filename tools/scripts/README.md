# Development Scripts

This directory contains utility scripts for development and testing.

## Script Files

### `node-check.js`
**Purpose**: Environment verification and Node.js compatibility testing
**Usage**: 
```bash
node scripts/node-check.js
```

**Features**:
- Checks if Node.js environment is properly configured
- Verifies test file availability
- Attempts to run Node.js-based tests
- Provides diagnostic information for setup issues

**Use Cases**:
- Troubleshooting Node.js installation issues
- Verifying test environment before running npm test commands
- Debugging test execution problems

## Usage Examples

### Check Node.js Setup
```bash
# Navigate to project root
cd path/to/softwareEngineering_teamDelta

# Run environment check
node scripts/node-check.js
```

### Expected Output
- ✅ Node.js version information
- ✅ Test file discovery
- ✅ Test execution results
- ❌ Error diagnostics (if issues found)

## Integration with Main Project

These scripts support the main development workflow:
1. **Environment Verification**: Ensure proper setup before development
2. **Test Diagnostics**: Debug test execution issues  
3. **Development Utilities**: Common tasks and checks

## Adding New Scripts

When adding new utility scripts:
1. Place them in this `scripts/` directory
2. Update this README with documentation
3. Use clear, descriptive filenames
4. Include usage examples and expected outputs