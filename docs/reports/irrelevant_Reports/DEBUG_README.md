# Tracing Utilities Documentation

A comprehensive debugging and error reporting module for JavaScript applications with focus on call stack analysis and parameter validation.

## Overview

The `tracing.js` module provides utilities for:
- **Stack trace analysis** - Capture and analyze function call chains
- **Function name extraction** - Identify specific functions in the call stack
- **Parameter validation** - Report type mismatches with detailed context  
- **Type detection** - Reliable type identification for all JavaScript values

## Quick Start

```javascript
// Import the module (Node.js)
const tracing = require('./debug/tracing.js');

// Get the complete call stack
const stack = tracing.getCurrentCallStack();
console.log(stack);

// Report parameter validation error
function validateInput(input) {
  if (typeof input !== 'string') {
    tracing.IncorrectParamPassed("string", input);
  }
}
```

## API Reference

### Functions

#### `getCurrentCallStack()`
Returns the complete call stack as a string.

**Returns:** `string` - Full stack trace with function names, files, and line numbers

**Example:**
```javascript
function debugMyCode() {
  console.log(getCurrentCallStack());
  // Output: Complete stack trace showing execution path
}
```

#### `getFunction(callStackLevel)`
Retrieves a specific line from the call stack.

**Parameters:**
- `callStackLevel` (number) - Stack level to retrieve (0=Error, 1=current, 2=caller, etc.)

**Returns:** `string` - Stack trace line at specified level

**Example:**
```javascript
function levelTwo() {
  return getFunction(2); // Gets caller's stack info
}

function levelOne() {
  return levelTwo(); // This function's info will be returned
}
```

#### `getFunctionName(callStackLevel)`
Extracts just the function name from a stack level.

**Parameters:**
- `callStackLevel` (number) - Stack level to extract name from

**Returns:** `string` - Function name, 'unknown', or 'error'

**Example:**
```javascript
function myFunction() {
  const currentName = getFunctionName(1); // Returns "myFunction"
  const callerName = getFunctionName(2);  // Returns caller's name
}
```

#### `IncorrectParamPassed(expectedParam, offendingParam)`
Reports parameter validation errors with context.

**Parameters:**
- `expectedParam` (any) - Example of expected parameter
- `offendingParam` (any) - The incorrect parameter that was passed

**Side Effects:** Logs detailed error to console.error

**Example:**
```javascript
function processString(text) {
  if (typeof text !== 'string') {
    IncorrectParamPassed("string example", text);
    return;
  }
  // Process the string...
}

function userCode() {
  processString(123); // Logs: "processString: Incorrect Param passed from userCode..."
}
```

#### `getType(variable)`
Determines precise type of any JavaScript variable.

**Parameters:**
- `variable` (any) - Variable to analyze

**Returns:** `string` - Precise type name

**Example:**
```javascript
getType([1, 2, 3]);    // "Array"
getType({});           // "Object"
getType(null);         // "Null"
getType(undefined);    // "Undefined"
getType(42);           // "Number"
getType("hello");      // "String"
getType(true);         // "Boolean"
getType(() => {});     // "Function"
```

### Constants

#### `functionNameRegX`
Regular expression for extracting function names from stack traces.

**Type:** `RegExp`  
**Pattern:** `/^([^@]*)/`

**Usage:**
```javascript
const stackLine = "myFunction@file.js:10:5";
const match = stackLine.match(functionNameRegX);
console.log(match[1]); // "myFunction"
```

## Usage Patterns

### Debug Function Calls
```javascript
function debugFunction() {
  console.log('Current function:', getFunctionName(1));
  console.log('Called by:', getFunctionName(2));
  console.log('Call chain:', getCurrentCallStack());
}
```

### Parameter Validation
```javascript
function validateParameters(requiredString, requiredNumber) {
  if (typeof requiredString !== 'string') {
    IncorrectParamPassed("string", requiredString);
    return false;
  }
  
  if (typeof requiredNumber !== 'number') {
    IncorrectParamPassed(42, requiredNumber);
    return false;
  }
  
  return true;
}
```

### Type Checking
```javascript
function handleData(data) {
  const dataType = getType(data);
  
  switch(dataType) {
    case 'Array':
      return data.length;
    case 'Object':
      return Object.keys(data).length;
    case 'String':
      return data.length;
    default:
      console.warn(`Unexpected type: ${dataType}`);
      return 0;
  }
}
```

## Error Handling

All functions handle edge cases gracefully:

- **Invalid stack levels** return 'error' or 'unknown'
- **Missing stack information** is handled with fallbacks
- **Type detection** works with all JavaScript values including null/undefined
- **Regex matching** provides safe fallbacks for malformed stack traces

## Testing

The module includes comprehensive tests covering:
- Stack trace generation and parsing
- Function name extraction accuracy
- Error handling for edge cases
- Parameter validation workflows
- Type detection for all JavaScript types

Run tests with:
```bash
npm run test:tracing
```

## Browser Compatibility

Works in all modern browsers and Node.js environments. Stack trace format may vary between JavaScript engines but core functionality remains consistent.

## Dependencies

None. Pure JavaScript with no external dependencies.