/**
 * @fileoverview ButtonGroupConfigLoader - JSON Configuration Management System
 * Handles loading, validation, and management of button group configurations
 * Part of the Universal Button Group System
 * 
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 */

/**
 * ButtonGroupConfigLoader - Manages JSON configuration loading and validation
 * Provides centralized configuration management for the Universal Button Group System
 */
class ButtonGroupConfigLoader {
  /**
   * Creates a new ButtonGroupConfigLoader instance
   * 
   * @param {Object} options - Loader configuration options
   */
  constructor(options = {}) {
    this.options = {
      basePath: options.basePath || './config/',
      enableCaching: options.enableCaching !== false,
      enableValidation: options.enableValidation !== false,
      debugMode: options.debugMode || false,
      ...options
    };

    // Configuration cache and state
    this.configCache = new Map();
    this.masterConfig = null;
    this.loadedConfigurations = new Map();
    this.validationErrors = [];
    this.isInitialized = false;
  }

  /**
   * Initialize the configuration loader with master configuration
   * 
   * @param {string|Object} masterConfigPath - Path to master config or config object
   * @returns {Promise<Object>} Initialization results
   */
  async initialize(masterConfigPath = 'button-system.json') {
    try {
      // Load master configuration
      if (typeof masterConfigPath === 'string') {
        this.masterConfig = await this.loadJSONFile(masterConfigPath);
      } else {
        this.masterConfig = masterConfigPath;
      }

      // Validate master configuration
      if (this.options.enableValidation) {
        this.validateMasterConfig(this.masterConfig);
      }

      // Pre-load startup configurations
      const startupResults = await this.loadStartupConfigurations();

      this.isInitialized = true;

      return {
        success: true,
        masterConfig: this.masterConfig,
        startupResults: startupResults,
        errors: this.validationErrors
      };
      
    } catch (error) {
      throw new Error(`Failed to initialize ButtonGroupConfigLoader: ${error.message}`);
    }
  }

  /**
   * Load configurations marked for startup loading
   * 
   * @returns {Promise<Object>} Loading results
   */
  async loadStartupConfigurations() {
    const results = {
      loaded: 0,
      failed: 0,
      errors: []
    };

    if (!this.masterConfig?.configFiles) {
      return results;
    }

    for (const configFile of this.masterConfig.configFiles) {
      if (configFile.loadOnStartup) {
        try {
          await this.loadConfigurationFile(configFile.path);
          results.loaded++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            file: configFile.path,
            error: error.message
          });
        }
      }
    }

    return results;
  }

  /**
   * Load a specific configuration file
   * 
   * @param {string} configPath - Path to configuration file
   * @returns {Promise<Object>} Loaded configuration data
   */
  async loadConfigurationFile(configPath) {
    // Check cache first
    if (this.options.enableCaching && this.configCache.has(configPath)) {
      return this.configCache.get(configPath);
    }

    try {
      const configData = await this.loadJSONFile(configPath);
      
      // Validate configuration
      if (this.options.enableValidation) {
        this.validateConfiguration(configData, configPath);
      }

      // Process and enhance configuration
      const processedConfig = this.processConfiguration(configData);

      // Cache the configuration
      if (this.options.enableCaching) {
        this.configCache.set(configPath, processedConfig);
      }

      // Store in loaded configurations
      this.loadedConfigurations.set(configPath, {
        data: processedConfig,
        loadTime: Date.now(),
        path: configPath
      });

      return processedConfig;
      
    } catch (error) {
      throw new Error(`Failed to load configuration file ${configPath}: ${error.message}`);
    }
  }

  /**
   * Get button groups for a specific game state
   * 
   * @param {string} gameState - Current game state
   * @returns {Array<Object>} Array of button group configurations for the state
   */
  getButtonGroupsForState(gameState) {
    const matchingGroups = [];

    for (const [path, configData] of this.loadedConfigurations) {
      if (configData.data?.groups) {
        for (const group of configData.data.groups) {
          // Check if group should be shown for this game state
          if (this.shouldShowGroupForState(group, gameState)) {
            matchingGroups.push({
              ...group,
              sourcePath: path,
              loadTime: configData.loadTime
            });
          }
        }
      }
    }

    // Sort by priority if available
    return matchingGroups.sort((a, b) => {
      const aPriority = this.getConfigPriority(a.sourcePath);
      const bPriority = this.getConfigPriority(b.sourcePath);
      return aPriority - bPriority;
    });
  }

  /**
   * Check if a button group should be shown for the given game state
   * 
   * @param {Object} group - Button group configuration
   * @param {string} gameState - Current game state
   * @returns {boolean} True if group should be shown
   */
  shouldShowGroupForState(group, gameState) {
    // Check group-level conditions
    if (group.conditions?.gameState) {
      return group.conditions.gameState === gameState;
    }

    // Check if the configuration file is associated with this game state
    const configFile = this.getConfigFileForGroup(group);
    if (configFile?.gameStates) {
      return configFile.gameStates.includes(gameState);
    }

    // Default to showing if no specific conditions
    return true;
  }

  /**
   * Get the configuration file entry for a group
   * 
   * @param {Object} group - Button group configuration
   * @returns {Object|null} Configuration file entry or null
   */
  getConfigFileForGroup(group) {
    if (!this.masterConfig?.configFiles) {
      return null;
    }

    // Find the config file that contains this group
    for (const configFile of this.masterConfig.configFiles) {
      const loadedConfig = this.loadedConfigurations.get(configFile.path);
      if (loadedConfig?.data?.groups) {
        const hasGroup = loadedConfig.data.groups.some(g => g.id === group.id);
        if (hasGroup) {
          return configFile;
        }
      }
    }

    return null;
  }

  /**
   * Get priority for a configuration file
   * 
   * @param {string} configPath - Path to configuration file
   * @returns {number} Priority value (lower = higher priority)
   */
  getConfigPriority(configPath) {
    if (!this.masterConfig?.configFiles) {
      return 999;
    }

    const configFile = this.masterConfig.configFiles.find(cf => cf.path === configPath);
    return configFile?.priority || 999;
  }

  /**
   * Load and parse a JSON file
   * 
   * @param {string} filePath - Path to JSON file
   * @returns {Promise<Object>} Parsed JSON data
   */
  async loadJSONFile(filePath) {
    try {
      // In browser environment, use fetch
      if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
        const fullPath = this.resolveFilePath(filePath);
        const response = await fetch(fullPath);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      }
      
      // In Node.js environment, use fs
      if (typeof require !== 'undefined') {
        const fs = require('fs').promises;
        const path = require('path');
        
        const fullPath = path.resolve(this.options.basePath, filePath);
        const fileContent = await fs.readFile(fullPath, 'utf8');
        return JSON.parse(fileContent);
      }
      
      throw new Error('No suitable method available to load JSON file');
      
    } catch (error) {
      throw new Error(`Failed to load JSON file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Resolve the full file path
   * 
   * @param {string} filePath - Relative file path
   * @returns {string} Resolved full path
   */
  resolveFilePath(filePath) {
    if (filePath.startsWith('./')) {
      return this.options.basePath + filePath.substring(2);
    }
    if (filePath.startsWith('/')) {
      return filePath;
    }
    return this.options.basePath + filePath;
  }

  /**
   * Process and enhance configuration data
   * 
   * @param {Object} configData - Raw configuration data
   * @returns {Object} Processed configuration data
   */
  processConfiguration(configData) {
    const processed = { ...configData };

    // Add system defaults if missing
    if (this.masterConfig?.defaultStyles && processed.groups) {
      processed.groups.forEach(group => {
        this.applyDefaultStyles(group);
      });
    }

    // Add metadata
    processed._processed = {
      timestamp: Date.now(),
      version: this.masterConfig?.meta?.version || '1.0.0',
      loader: 'ButtonGroupConfigLoader'
    };

    return processed;
  }

  /**
   * Apply default styles to a button group
   * 
   * @param {Object} group - Button group configuration
   */
  applyDefaultStyles(group) {
    if (!this.masterConfig?.defaultStyles) {
      return;
    }

    // Apply group defaults
    if (this.masterConfig.defaultStyles.group && !group.appearance?.background) {
      group.appearance = group.appearance || {};
      group.appearance.background = group.appearance.background || {};
      
      // Apply defaults where not specified
      Object.entries(this.masterConfig.defaultStyles.group).forEach(([key, value]) => {
        if (group.appearance.background[key] === undefined) {
          group.appearance.background[key] = value;
        }
      });
    }

    // Apply button defaults
    if (this.masterConfig.defaultStyles.button && group.buttons) {
      group.buttons.forEach(button => {
        button.style = button.style || {};
        
        Object.entries(this.masterConfig.defaultStyles.button).forEach(([key, value]) => {
          if (button.style[key] === undefined) {
            button.style[key] = value;
          }
        });
      });
    }
  }

  /**
   * Validate master configuration
   * 
   * @param {Object} config - Master configuration to validate
   */
  validateMasterConfig(config) {
    const errors = [];

    // Check required fields
    if (!config.meta) {
      errors.push('Master configuration missing meta section');
    }
    
    if (!config.configFiles || !Array.isArray(config.configFiles)) {
      errors.push('Master configuration missing or invalid configFiles array');
    }

    if (!config.gameStates || typeof config.gameStates !== 'object') {
      errors.push('Master configuration missing or invalid gameStates section');
    }

    // Validate config files
    if (config.configFiles) {
      config.configFiles.forEach((configFile, index) => {
        if (!configFile.path) {
          errors.push(`Config file ${index} missing path`);
        }
        if (!configFile.gameStates || !Array.isArray(configFile.gameStates)) {
          errors.push(`Config file ${index} missing or invalid gameStates`);
        }
      });
    }

    if (errors.length > 0) {
      this.validationErrors.push(...errors);
      if (this.options.debugMode) {
        console.warn('Master configuration validation errors:', errors);
      }
    }
  }

  /**
   * Validate individual configuration
   * 
   * @param {Object} config - Configuration to validate
   * @param {string} configPath - Path to configuration file
   */
  validateConfiguration(config, configPath) {
    const errors = [];

    // Check required fields
    if (!config.groups || !Array.isArray(config.groups)) {
      errors.push(`${configPath}: Missing or invalid groups array`);
    }

    // Validate each group
    if (config.groups) {
      config.groups.forEach((group, index) => {
        this.validateButtonGroup(group, `${configPath}[${index}]`, errors);
      });
    }

    if (errors.length > 0) {
      this.validationErrors.push(...errors);
      if (this.options.debugMode) {
        console.warn(`Configuration validation errors for ${configPath}:`, errors);
      }
    }
  }

  /**
   * Validate a button group configuration
   * 
   * @param {Object} group - Button group to validate
   * @param {string} context - Context for error messages
   * @param {Array} errors - Array to collect errors
   */
  validateButtonGroup(group, context, errors) {
    const validation = this.masterConfig?.validation;

    // Check required fields
    if (validation?.requiredFields) {
      validation.requiredFields.forEach(field => {
        if (!group[field]) {
          errors.push(`${context}: Missing required field '${field}'`);
        }
      });
    }

    // Check button count limits
    if (validation?.maxButtonsPerGroup && group.buttons) {
      if (group.buttons.length > validation.maxButtonsPerGroup) {
        errors.push(`${context}: Too many buttons (${group.buttons.length} > ${validation.maxButtonsPerGroup})`);
      }
    }

    // Validate button sizes
    if (validation && group.buttons) {
      group.buttons.forEach((button, btnIndex) => {
        if (button.size) {
          const { minButtonSize, maxButtonSize } = validation;
          
          if (minButtonSize) {
            if (button.size.width < minButtonSize.width || button.size.height < minButtonSize.height) {
              errors.push(`${context}.buttons[${btnIndex}]: Button too small`);
            }
          }
          
          if (maxButtonSize) {
            if (button.size.width > maxButtonSize.width || button.size.height > maxButtonSize.height) {
              errors.push(`${context}.buttons[${btnIndex}]: Button too large`);
            }
          }
        }
      });
    }
  }

  /**
   * Get master configuration
   * 
   * @returns {Object|null} Master configuration or null if not loaded
   */
  getMasterConfig() {
    return this.masterConfig;
  }

  /**
   * Get all loaded configurations
   * 
   * @returns {Map} Map of loaded configurations
   */
  getLoadedConfigurations() {
    return new Map(this.loadedConfigurations);
  }

  /**
   * Get validation errors
   * 
   * @returns {Array} Array of validation errors
   */
  getValidationErrors() {
    return [...this.validationErrors];
  }

  /**
   * Clear configuration cache
   */
  clearCache() {
    this.configCache.clear();
  }

  /**
   * Reload a specific configuration file
   * 
   * @param {string} configPath - Path to configuration file to reload
   * @returns {Promise<Object>} Reloaded configuration
   */
  async reloadConfiguration(configPath) {
    // Remove from cache
    this.configCache.delete(configPath);
    this.loadedConfigurations.delete(configPath);

    // Reload
    return await this.loadConfigurationFile(configPath);
  }

  /**
   * Get diagnostic information about the loader
   * 
   * @returns {Object} Diagnostic information
   */
  getDiagnosticInfo() {
    return {
      isInitialized: this.isInitialized,
      cacheSize: this.configCache.size,
      loadedConfigurations: this.loadedConfigurations.size,
      validationErrors: this.validationErrors.length,
      masterConfigLoaded: !!this.masterConfig,
      options: { ...this.options }
    };
  }
}

// Export for browser environments
if (typeof window !== 'undefined') {
  window.ButtonGroupConfigLoader = ButtonGroupConfigLoader;
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ButtonGroupConfigLoader;
}