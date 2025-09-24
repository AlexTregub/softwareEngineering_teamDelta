/**
 * @fileoverview Stack tracing utilities for debugging and error reporting
 * Provides functions for analyzing call stacks, extracting function names,
 * and generating detailed error reports for parameter validation.
 * 
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 */

/**
 * Regular expression pattern for extracting function names from stack trace lines.
 * Captures everything before the first '@' symbol, which typically contains the function name.
 * @type {RegExp}
 * @example
 * // Matches "functionName" from "functionName@file.js:10:5"
 * const match = "functionName@file.js:10:5".match(functionNameRegX);
 * console.log(match[1]); // "functionName"
 */
const functionNameRegX = /^([^@]*)/

/**
 * Retrieves the complete call stack trace as a string.
 * Useful for debugging and understanding the execution flow.
 * 
 * @returns {string} The complete stack trace including function names, file paths, and line numbers
 * @example
 * function myFunction() {
 *   console.log(getCurrentCallStack());
 *   // Output: Error\n    at myFunction (file.js:2:15)\n    at Object.<anonymous> (file.js:5:1)...
 * }
 */
function getCurrentCallStack() {
  const stack = new Error().stack;
  return stack;
}

/**
 * Retrieves a specific line from the call stack based on the provided level.
 * Stack levels: 0=Error, 1=current function, 2=caller, 3=caller's caller, etc.
 * 
 * @param {number} callStackLevel - The stack level to retrieve (0-based index)
 * @returns {string} The stack trace line at the specified level, or undefined if level doesn't exist
 * @example
 * function levelTwo() {
 *   return getFunction(2); // Gets levelOne's stack info
 * }
 * 
 * function levelOne() {
 *   return levelTwo();
 * }
 * 
 * levelOne(); // Returns stack line for levelOne
 */
function getFunction(callStackLevel) {
  const stack = new Error().stack;
  const stackLines = stack.split('\n');
  // stackLines[0] is "Error"
  // stackLines[1] is current function
  // stackLines[2] is calling function
  return stackLines[callStackLevel];
}

/**
 * Extracts the function name from a specific stack level using regex pattern matching.
 * Handles errors gracefully and provides fallback values for edge cases.
 * 
 * @param {number} callStackLevel - The stack level to extract the function name from
 * @returns {string} The function name, 'unknown' if not found, or 'error' if an exception occurs
 * @example
 * function testFunction() {
 *   return getFunctionName(1); // Returns "testFunction"
 * }
 * 
 * function caller() {
 *   return getFunctionName(2); // Returns "caller"  
 * }
 */
function getFunctionName(callStackLevel) {
  try {
    const stack = new Error().stack;
    const callerLine = stack.split('\n')[callStackLevel];
    const match = callerLine.match(functionNameRegX);
    return match ? match[1] : 'unknown';
  } catch (e) {
    return 'error';
  }
}

/**
 * Reports parameter type validation errors with detailed stack trace information.
 * Automatically identifies the calling function and the function that passed the incorrect parameter.
 * Logs a formatted error message to console.error with type information.
 * 
 * @param {*} expectedParam - Example of the expected parameter type/value
 * @param {*} offendingParam - The actual parameter that was incorrectly passed
 * @example
 * function validateString(str) {
 *   if (typeof str !== 'string') {
 *     IncorrectParamPassed("string example", str);
 *   }
 * }
 * 
 * function userCode() {
 *   validateString(123); // Logs: "validateString: Incorrect Param passed from userCode..."
 * }
 */
function IncorrectParamPassed(expectedParam, offendingParam) {
    let callingFunc = getFunctionName(2)
    let offendingFunc = getFunctionName(3)
    console.error (`${callingFunc}: Incorrect Param passed` + 
        ` from ${offendingFunc}.` +
        `\nExpecting Type ${getType(expectedParam)},` +
        ` recieved ${getType(offendingParam)} instead`)
}

/**
 * Issues a deprecation warning for a function and executes its replacement.
 * Validates that the replacement parameter is a function, logs a warning message,
 * and then calls the replacement function with any additional arguments passed.
 * Provides detailed parameter debugging information when called with a valid function.
 * 
 * @param {Function} replacementFunction - The function to use as a replacement for the deprecated function
 * @param {...*} [args] - Additional arguments to pass to the replacement function
 * @returns {*} The return value of the replacement function, or undefined if validation fails
 * 
 * @example
 * // Define old and new functions
 * function oldFunction(x, y) {
 *   return deprecatedWarning(newFunction, x, y);
 * }
 * 
 * function newFunction(x, y) {
 *   return x + y;
 * }
 * 
 * // Usage - logs warning and calls newFunction
 * const result = oldFunction(5, 3); // Warns: "oldFunction is deprecated. Use newFunction() instead."
 * console.log(result); // 8
 * 
 * @example
 * // Invalid usage - triggers parameter error
 * function badUsage() {
 *   return deprecatedWarning("not a function"); // Logs parameter error and returns undefined
 * }
 */
function deprecatedWarning(replacementFunction) {
    if (typeof replacementFunction === "function") {
        console.warn(`${getFunctionName(2)} is deprecated. Use ${replacementFunction.name}() instead.`);
        paramInfo(replacementFunction)
    return replacementFunction.apply(null, arguments.length > 1 ? Array.prototype.slice.call(arguments, 1) : []);
    } else {
        IncorrectParamPassed(() => {}, replacementFunction);
        return undefined;
    }
}

/**
 * Outputs comprehensive debugging information about a parameter to the console.
 * Provides detailed analysis including type information, function properties,
 * object structure, and call stack context. Useful for debugging parameter
 * validation issues and understanding what values are being passed to functions.
 * 
 * @param {*} param - The parameter to analyze and debug
 * @returns {void} This function only logs information and does not return a value
 * 
 * @example
 * // Debugging a function parameter
 * function testFunc(x, y) { return x + y; }
 * paramInfo(testFunc);
 * // Output:
 * // === Parameter Debug Info ===
 * // Received: [Function: testFunc]
 * // Type: function
 * // Is function: true
 * // Function name: testFunc
 * // Function length (params): 2
 * // Function string preview: function testFunc(x, y) { return x + y; }...
 * 
 * @example
 * // Debugging an object parameter
 * const obj = { name: "test", value: 42 };
 * paramInfo(obj);
 * // Output:
 * // === Parameter Debug Info ===
 * // Received: { name: "test", value: 42 }
 * // Type: object
 * // Is function: false
 * // Object keys: ["name", "value"]
 * // Constructor: Object
 * 
 * @example
 * // Debugging a string parameter
 * paramInfo("hello world");
 * // Output:
 * // === Parameter Debug Info ===
 * // Received: hello world
 * // Type: string
 * // Is function: false
 * // String value: "hello world"
 * // String length: 11
 */
function paramInfo(param) {
    console.log("=== Parameter Debug Info ===");
    console.log("Received:", param);
    console.log("Type:", typeof param);
    console.log("Is function:", typeof param === "function");
    console.log("Is null:", param === null);
    console.log("Is undefined:", param === undefined);
    console.log("Detailed type:", getType(param));
    
    if (typeof param === "function") {
        console.log("Function name:", param.name || "(anonymous)");
        console.log("Function length (params):", param.length);
        console.log("Function string preview:", param.toString().substring(0, 100) + "...");
    } else if (typeof param === "string") {
        console.log("String value:", `"${param}"`);
        console.log("String length:", param.length);
    } else if (typeof param === "object" && param !== null) {
        console.log("Object keys:", Object.keys(param));
        console.log("Constructor:", param.constructor?.name || "unknown");
    }
    
    console.log("Called from function:", getFunctionName(3));
    console.log("=============================");
}

/**
 * Determines the precise type of any JavaScript variable using Object.prototype.toString.
 * More reliable than typeof for distinguishing between objects, arrays, null, etc.
 * 
 * @param {*} variable - The variable to analyze
 * @returns {string} The precise type name (e.g., 'Array', 'Object', 'Null', 'Number', 'String')
 * @example
 * getType([1, 2, 3]);     // Returns "Array"
 * getType({});            // Returns "Object" 
 * getType(null);          // Returns "Null"
 * getType(42);            // Returns "Number"
 * getType("hello");       // Returns "String"
 * getType(undefined);     // Returns "Undefined"
 */
function getType(variable) {
  return Object.prototype.toString.call(variable).slice(8, -1);
}


/**
 * Module exports for Node.js compatibility.
 * All functions and constants are exported for use in testing and other modules.
 * 
 * @module TracingUtilities
 * @exports {Object} An object containing all tracing utility functions and regex patterns
 */
if (typeof module !== "undefined" && module.exports) {
  module.exports = { 
    getCurrentCallStack, 
    getFunction,
    getFunctionName,
    IncorrectParamPassed,
    deprecatedWarning,
    paramInfo,
    getType,
    functionNameRegX
  };
}