// Quick debug script to understand the import issue
console.log("Testing imports...");

try {
  const antsModule = require('../Classes/ants/ants.js');
  console.log("ants.js exported:", typeof antsModule, antsModule?.name);
  
  const speciesModule = require('../Classes/ants/species.js');
  console.log("species.js exported:", typeof speciesModule, speciesModule?.name);
  
  // Test if Species can extend the ant
  console.log("Can create Species?", typeof speciesModule === 'function');
  
} catch (error) {
  console.error("Import error:", error.message);
}