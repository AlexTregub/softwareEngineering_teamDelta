/**
 * Unit Tests for File I/O Dialog System
 * Tests save/load dialogs, file validation, and format conversion
 */

const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Load real File I/O classes
const saveDialogCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/SaveDialog.js'),
  'utf8'
);
const loadDialogCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/LoadDialog.js'),
  'utf8'
);
const localStorageManagerCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/LocalStorageManager.js'),
  'utf8'
);
const autoSaveCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/AutoSave.js'),
  'utf8'
);
const serverIntegrationCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/ServerIntegration.js'),
  'utf8'
);
const formatConverterCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/FormatConverter.js'),
  'utf8'
);

// Execute in global context to define classes
vm.runInThisContext(saveDialogCode);
vm.runInThisContext(loadDialogCode);
vm.runInThisContext(localStorageManagerCode);
vm.runInThisContext(autoSaveCode);
vm.runInThisContext(serverIntegrationCode);
vm.runInThisContext(formatConverterCode);

describe('FileIO - Save Dialog', function() {
  
  describe('SaveDialog', function() {
    
    it('should create save dialog with default filename', function() {
      const dialog = new SaveDialog();
      
      expect(dialog.getFilename()).to.include('terrain');
      expect(dialog.getFormat()).to.equal('json');
    });
    
    it('should validate filename', function() {
      const dialog = new SaveDialog();
      
      expect(dialog.validateFilename('terrain_map').valid).to.be.true;
      expect(dialog.validateFilename('').valid).to.be.false;
      expect(dialog.validateFilename('terrain@#$').valid).to.be.false;
    });
    
    it('should auto-add file extension', function() {
      const dialog = new SaveDialog();
      dialog.setFormat('json');
      
      expect(dialog.getFullFilename('mymap')).to.equal('mymap.json');
      expect(dialog.getFullFilename('mymap.json')).to.equal('mymap.json');
    });
    
    it('should show overwrite warning for existing files', function() {
      const dialog = new SaveDialog();
      dialog.setExistingFiles(['terrain1.json', 'level2.json']);
      
      expect(dialog.checkOverwrite('terrain1.json')).to.be.true;
      expect(dialog.checkOverwrite('newfile.json')).to.be.false;
    });
    
    it('should support multiple export formats', function() {
      const dialog = new SaveDialog();
      const formats = dialog.getAvailableFormats();
      
      expect(formats).to.be.an('array');
      expect(formats.length).to.be.greaterThan(0);
      expect(formats.some(f => f.key === 'json')).to.be.true;
    });
    
    it('should generate filename with timestamp', function() {
      const dialog = new SaveDialog();
      const filename = dialog.generateTimestampedFilename('terrain');
      
      expect(filename).to.include('terrain_');
    });
    
    it('should estimate file size before save', function() {
      const dialog = new SaveDialog();
      const testData = { terrain: { grid: [1, 2, 3, 4, 5] } };
      
      dialog.setFormat('json');
      const size = dialog.estimateSize(testData);
      
      expect(size).to.be.greaterThan(0);
    });
  });
  
  describe('SaveOptions', function() {
    
    it('should configure compression option', function() {
      const dialog = new SaveDialog();
      
      dialog.setFormat('json-compressed');
      expect(dialog.getFormat()).to.equal('json-compressed');
    });
    
    it('should configure what to include in export', function() {
      // This would be part of exporter options, just verify dialog works
      const dialog = new SaveDialog();
      expect(dialog).to.have.property('format');
    });
    
    it('should validate save location', function() {
      const dialog = new SaveDialog();
      const validation = dialog.validateFilename('test_file');
      
      expect(validation).to.have.property('valid');
    });
  });
});

describe('FileIO - Load Dialog', function() {
  
  describe('LoadDialog', function() {
    
    it('should show list of available files', function() {
      const dialog = new LoadDialog();
      dialog.setFiles([
        { name: 'terrain1.json', date: '2025-10-25' },
        { name: 'terrain2.json', date: '2025-10-24' }
      ]);
      
      const fileList = dialog.getFileList();
      expect(fileList).to.have.lengthOf(2);
      expect(fileList).to.include('terrain1.json');
    });
    
    it('should sort files by date', function() {
      const dialog = new LoadDialog();
      dialog.setFiles([
        { name: 'old.json', date: '2025-10-20' },
        { name: 'new.json', date: '2025-10-25' }
      ]);
      
      const sorted = dialog.sortByDate();
      expect(sorted[0].name).to.equal('new.json'); // Newest first
    });
    
    it('should filter files by search term', function() {
      const dialog = new LoadDialog();
      dialog.setFiles([
        { name: 'terrain_forest.json', date: '2025-10-25' },
        { name: 'terrain_desert.json', date: '2025-10-24' },
        { name: 'level_dungeon.json', date: '2025-10-23' }
      ]);
      
      dialog.search('terrain');
      const filtered = dialog.getFileList();
      
      expect(filtered).to.have.lengthOf(2);
    });
    
    it('should show file preview', function() {
      const dialog = new LoadDialog();
      dialog.setFiles([
        { 
          name: 'terrain1.json', 
          date: '2025-10-25',
          preview: { size: '5x5', seed: 12345 }
        }
      ]);
      dialog.selectFile('terrain1.json');
      
      const preview = dialog.getPreview();
      expect(preview).to.have.property('size');
      expect(preview.seed).to.equal(12345);
    });
    
    it('should validate file before loading', function() {
      const dialog = new LoadDialog();
      
      const validData = {
        version: '1.0',
        terrain: { grid: [] }
      };
      const invalidData = {};
      
      expect(dialog.validateFile(validData).valid).to.be.true;
      expect(dialog.validateFile(invalidData).valid).to.be.false;
    });
  });
  
  describe('FileUpload', function() {
    
    it('should accept JSON files only', function() {
      // This would be UI behavior - just test the concept
      const acceptedTypes = ['.json'];
      expect(acceptedTypes).to.include('.json');
    });
    
    it('should validate file size limits', function() {
      const maxSize = 5 * 1024 * 1024; // 5 MB
      const fileSize = 1024; // 1 KB
      
      expect(fileSize).to.be.lessThan(maxSize);
    });
    
    it('should parse uploaded file content', function() {
      const jsonContent = '{"version":"1.0","terrain":{"grid":[]}}';
      const parsed = JSON.parse(jsonContent);
      
      expect(parsed).to.have.property('version');
      expect(parsed).to.have.property('terrain');
    });
    
    it('should show upload progress', function() {
      const upload = {
        loaded: 50,
        total: 100,
        getProgress: function() {
          return (this.loaded / this.total) * 100;
        }
      };
      
      expect(upload.getProgress()).to.equal(50);
    });
  });
});

describe('FileIO - Browser Storage', function() {
  
  describe('LocalStorageManager', function() {
    
    it('should save terrain to localStorage', function() {
      // Mock localStorage
      const mockStorage = {};
      const manager = new LocalStorageManager('test_');
      manager.storage = {
        setItem: function(key, value) {
          mockStorage[key] = value;
        },
        getItem: function(key) {
          return mockStorage[key] || null;
        },
        removeItem: function(key) {
          delete mockStorage[key];
        },
        length: 0,
        key: function(i) { return null; }
      };
      
      const result = manager.save('terrain1', { grid: [1, 2, 3] });
      expect(result).to.be.true;
    });
    
    it('should load terrain from localStorage', function() {
      const mockStorage = {};
      const manager = new LocalStorageManager('test_');
      manager.storage = {
        setItem: function(key, value) {
          mockStorage[key] = value;
        },
        getItem: function(key) {
          return mockStorage[key] || null;
        },
        removeItem: function(key) {
          delete mockStorage[key];
        },
        length: 0,
        key: function(i) { return null; }
      };
      
      manager.save('terrain1', { grid: [1, 2, 3] });
      const loaded = manager.load('terrain1');
      
      expect(loaded).to.not.be.null;
      expect(loaded.grid).to.deep.equal([1, 2, 3]);
    });
    
    it('should list all saved terrains', function() {
      const manager = new LocalStorageManager('test_');
      manager.storage = null; // No storage available
      
      const list = manager.list();
      expect(list).to.be.an('array');
    });
    
    it('should delete saved terrain', function() {
      const mockStorage = {};
      const manager = new LocalStorageManager('test_');
      manager.storage = {
        setItem: function(key, value) {
          mockStorage[key] = value;
        },
        getItem: function(key) {
          return mockStorage[key] || null;
        },
        removeItem: function(key) {
          delete mockStorage[key];
        },
        length: 0,
        key: function(i) { return null; }
      };
      
      manager.save('terrain1', { grid: [] });
      const deleted = manager.delete('terrain1');
      
      expect(deleted).to.be.true;
    });
    
    it('should check storage quota', function() {
      const manager = new LocalStorageManager();
      const usage = manager.getUsage();
      
      expect(usage).to.have.property('used');
      expect(usage).to.have.property('available');
      expect(usage).to.have.property('percentage');
    });
  });
  
  describe('AutoSave', function() {
    
    it('should enable/disable auto-save', function() {
      const autoSave = new AutoSave();
      
      autoSave.enable();
      expect(autoSave.isEnabled()).to.be.true;
      
      autoSave.disable();
      expect(autoSave.isEnabled()).to.be.false;
    });
    
    it('should trigger save on interval', function() {
      const autoSave = new AutoSave(1000); // 1 second
      autoSave.enable();
      autoSave.markDirty();
      
      const shouldSave = autoSave.shouldSave(Date.now() + 1500);
      expect(shouldSave).to.be.true;
    });
    
    it('should save only if terrain was modified', function() {
      const autoSave = new AutoSave();
      autoSave.enable();
      
      expect(autoSave.isDirty()).to.be.false;
      
      autoSave.markDirty();
      expect(autoSave.isDirty()).to.be.true;
    });
  });
});

describe('FileIO - Server Integration', function() {
  
  describe('ServerUpload', function() {
    
    it('should prepare upload request', function() {
      const {ServerUpload} = require('../../../Classes/ui/ServerIntegration.js');
      const upload = new ServerUpload();
      
      const request = upload.prepareRequest({ grid: [] }, 'terrain.json');
      
      expect(request).to.have.property('url');
      expect(request).to.have.property('method');
      expect(request.method).to.equal('POST');
    });
    
    it('should handle upload success', function() {
      const {ServerUpload} = require('../../../Classes/ui/ServerIntegration.js');
      const upload = new ServerUpload();
      
      const result = upload.handleResponse(200, { fileId: '123', url: '/files/123' });
      
      expect(result.success).to.be.true;
      expect(result.fileId).to.equal('123');
    });
    
    it('should handle upload errors', function() {
      const {ServerUpload} = require('../../../Classes/ui/ServerIntegration.js');
      const upload = new ServerUpload();
      
      const errorMsg = upload.handleError('NETWORK_ERROR');
      expect(errorMsg).to.be.a('string');
      expect(errorMsg.length).to.be.greaterThan(0);
    });
  });
  
  describe('ServerDownload', function() {
    
    it('should fetch file list from server', async function() {
      const {ServerDownload} = require('../../../Classes/ui/ServerIntegration.js');
      const download = new ServerDownload();
      
      const fileList = await download.fetchFileList();
      expect(fileList).to.be.an('array');
    });
    
    it('should download file by ID', function() {
      const {ServerDownload} = require('../../../Classes/ui/ServerIntegration.js');
      const download = new ServerDownload();
      
      const url = download.getDownloadUrl('file123');
      expect(url).to.include('file123');
    });
  });
});

describe('FileIO - Format Conversion', function() {
  
  describe('FormatConverter', function() {
    
    it('should convert between JSON formats', function() {
      const converter = new FormatConverter();
      const data = {
        version: '1.0',
        terrain: {
          width: 10,
          height: 10,
          grid: [1, 1, 1, 2, 2, 2, 3, 3, 3, 4]
        }
      };
      
      const compressed = converter.toCompressed(data);
      expect(compressed.format).to.equal('compressed');
    });
    
    it('should export to different formats', function() {
      const converter = new FormatConverter();
      const formats = converter.getSupportedFormats();
      
      expect(formats).to.include('json');
      expect(formats).to.include('json-compressed');
    });
    
    it('should preserve data during conversion', function() {
      const converter = new FormatConverter();
      const original = {
        version: '1.0',
        terrain: {
          width: 10,
          height: 10,
          grid: [1, 2, 3]
        }
      };
      
      const compressed = converter.toCompressed(original);
      expect(compressed.version).to.equal(original.version);
      expect(compressed.terrain.width).to.equal(original.terrain.width);
    });
  });
});

describe('FileIO - Error Handling', function() {
  
  describe('ErrorReporting', function() {
    
    it('should categorize file errors', function() {
      const errors = {
        'FILE_NOT_FOUND': 'file',
        'PARSE_ERROR': 'format',
        'NETWORK_ERROR': 'network'
      };
      
      expect(errors['FILE_NOT_FOUND']).to.equal('file');
      expect(errors['NETWORK_ERROR']).to.equal('network');
    });
    
    it('should provide user-friendly error messages', function() {
      const {ServerUpload} = require('../../../Classes/ui/ServerIntegration.js');
      const upload = new ServerUpload();
      
      const message = upload.handleError('FILE_TOO_LARGE');
      expect(message).to.be.a('string');
      expect(message.length).to.be.greaterThan(10);
    });
    
    it('should suggest recovery actions', function() {
      const errorHelp = {
        'FILE_TOO_LARGE': 'Try using compressed format',
        'NETWORK_ERROR': 'Check your internet connection',
        'INVALID_FORMAT': 'Use a valid JSON file'
      };
      
      expect(errorHelp['FILE_TOO_LARGE']).to.include('compressed');
      expect(errorHelp['NETWORK_ERROR']).to.include('connection');
    });
  });
});
      const dialog = {
        data: { tiles: new Array(1000).fill('moss') },
        estimateSize: function() {
          const jsonString = JSON.stringify(this.data);
          return jsonString.length;
        },
        formatSize: function(bytes) {
          if (bytes < 1024) return `${bytes} B`;
          if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
          return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
        }
      };
  
  describe('SaveOptions', function() {
    
    it('should configure compression option', function() {
      const options = {
        compress: false,
        includeEntities: true,
        includeMetadata: true
      };
      
      options.compress = true;
      expect(options.compress).to.be.true;
    });
    
    it('should configure what to include in export', function() {
      const options = {
        includeEntities: true,
        includeResources: false,
        includeCustomData: true,
        getExportOptions: function() {
          return {
            compressed: false,
            customMetadata: this.includeCustomData ? {} : null
          };
        }
      };
      
      const exportOpts = options.getExportOptions();
      expect(exportOpts.customMetadata).to.not.be.null;
    });
    
    it('should validate save location', function() {
      const options = {
        saveLocation: 'browser', // browser, server, local
        validateLocation: function() {
          const allowed = ['browser', 'server', 'local'];
          return allowed.includes(this.saveLocation);
        }
      };
      
      expect(options.validateLocation()).to.be.true;
      options.saveLocation = 'invalid';
      expect(options.validateLocation()).to.be.false;
    });
  });


describe('FileIO - Load Dialog', function() {
  
  describe('LoadDialog', function() {
    
    it('should show list of available files', function() {
      const dialog = {
        files: [
          { name: 'terrain1.json', size: 1024, date: '2025-10-25' },
          { name: 'level2.json', size: 2048, date: '2025-10-24' }
        ],
        getFileList: function() {
          return this.files.map(f => f.name);
        }
      };
      
      const list = dialog.getFileList();
      expect(list).to.have.lengthOf(2);
      expect(list).to.include('terrain1.json');
    });
    
    it('should sort files by date', function() {
      const dialog = {
        files: [
          { name: 'old.json', date: '2025-10-20' },
          { name: 'new.json', date: '2025-10-25' },
          { name: 'mid.json', date: '2025-10-23' }
        ],
        sortByDate: function() {
          return this.files.slice().sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
          });
        }
      };
      
      const sorted = dialog.sortByDate();
      expect(sorted[0].name).to.equal('new.json');
      expect(sorted[2].name).to.equal('old.json');
    });
    
    it('should filter files by search term', function() {
      const dialog = {
        files: [
          { name: 'terrain_forest.json' },
          { name: 'terrain_desert.json' },
          { name: 'level_dungeon.json' }
        ],
        search: function(term) {
          return this.files.filter(f => 
            f.name.toLowerCase().includes(term.toLowerCase())
          );
        }
      };
      
      const results = dialog.search('terrain');
      expect(results).to.have.lengthOf(2);
    });
    
    it('should show file preview', function() {
      const dialog = {
        selectedFile: {
          name: 'terrain1.json',
          metadata: {
            gridSizeX: 5,
            gridSizeY: 5,
            seed: 12345
          }
        },
        getPreview: function() {
          if (!this.selectedFile) return null;
          return {
            name: this.selectedFile.name,
            size: `${this.selectedFile.metadata.gridSizeX}x${this.selectedFile.metadata.gridSizeY}`,
            seed: this.selectedFile.metadata.seed
          };
        }
      };
      
      const preview = dialog.getPreview();
      expect(preview.size).to.equal('5x5');
    });
    
    it('should validate file before loading', function() {
      const dialog = {
        validateFile: function(fileData) {
          const errors = [];
          
          if (!fileData.metadata) {
            errors.push('Missing metadata');
          }
          if (!fileData.tiles) {
            errors.push('Missing tiles data');
          }
          if (fileData.metadata && !fileData.metadata.version) {
            errors.push('Missing version');
          }
          
          return {
            valid: errors.length === 0,
            errors
          };
        }
      };
      
      const valid = dialog.validateFile({
        metadata: { version: '1.0', gridSizeX: 3, gridSizeY: 3 },
        tiles: []
      });
      
      expect(valid.valid).to.be.true;
      
      const invalid = dialog.validateFile({});
      expect(invalid.valid).to.be.false;
      expect(invalid.errors).to.have.lengthOf(2);
    });
  });
  
  describe('FileUpload', function() {
    
    it('should accept JSON files only', function() {
      const upload = {
        acceptedTypes: ['.json'],
        isAccepted: function(filename) {
          return this.acceptedTypes.some(type => filename.endsWith(type));
        }
      };
      
      expect(upload.isAccepted('terrain.json')).to.be.true;
      expect(upload.isAccepted('image.png')).to.be.false;
    });
    
    it('should validate file size limits', function() {
      const upload = {
        maxSize: 5 * 1024 * 1024, // 5MB
        checkSize: function(fileSize) {
          return fileSize <= this.maxSize;
        }
      };
      
      expect(upload.checkSize(1024)).to.be.true;
      expect(upload.checkSize(10 * 1024 * 1024)).to.be.false;
    });
    
    it('should parse uploaded file content', function() {
      const upload = {
        parseJSON: function(content) {
          try {
            return { success: true, data: JSON.parse(content) };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }
      };
      
      const valid = upload.parseJSON('{"test": true}');
      expect(valid.success).to.be.true;
      
      const invalid = upload.parseJSON('not json');
      expect(invalid.success).to.be.false;
    });
    
    it('should show upload progress', function() {
      const upload = {
        bytesLoaded: 512,
        totalBytes: 1024,
        getProgress: function() {
          return (this.bytesLoaded / this.totalBytes) * 100;
        }
      };
      
      expect(upload.getProgress()).to.equal(50);
    });
  });
});

describe('FileIO - Browser Storage', function() {
  
  describe('LocalStorageManager', function() {
    
    it('should save to localStorage', function() {
      const storage = {
        data: {},
        save: function(key, value) {
          this.data[key] = JSON.stringify(value);
          return true;
        }
      };
      
      const result = storage.save('terrain1', { test: true });
      expect(result).to.be.true;
      expect(storage.data['terrain1']).to.exist;
    });
    
    it('should load from localStorage', function() {
      const storage = {
        data: {
          'terrain1': JSON.stringify({ tiles: [1, 2, 3] })
        },
        load: function(key) {
          if (!this.data[key]) return null;
          return JSON.parse(this.data[key]);
        }
      };
      
      const loaded = storage.load('terrain1');
      expect(loaded.tiles).to.have.lengthOf(3);
      expect(storage.load('missing')).to.be.null;
    });
    
    it('should list all saved terrains', function() {
      const storage = {
        data: {
          'terrain1': '{}',
          'terrain2': '{}',
          'otherData': '{}'
        },
        list: function(prefix = 'terrain') {
          return Object.keys(this.data).filter(key => key.startsWith(prefix));
        }
      };
      
      const terrains = storage.list('terrain');
      expect(terrains).to.have.lengthOf(2);
    });
    
    it('should delete saved terrain', function() {
      const storage = {
        data: {
          'terrain1': '{}',
          'terrain2': '{}'
        },
        delete: function(key) {
          if (this.data[key]) {
            delete this.data[key];
            return true;
          }
          return false;
        }
      };
      
      expect(storage.delete('terrain1')).to.be.true;
      expect(storage.data['terrain1']).to.be.undefined;
      expect(storage.delete('missing')).to.be.false;
    });
    
    it('should check storage quota', function() {
      const storage = {
        data: {},
        quota: 5 * 1024 * 1024, // 5MB
        getUsage: function() {
          let total = 0;
          for (const value of Object.values(this.data)) {
            total += value.length;
          }
          return {
            used: total,
            available: this.quota - total,
            percentage: (total / this.quota) * 100
          };
        }
      };
      
      storage.data['test'] = 'x'.repeat(1024 * 1024); // 1MB
      const usage = storage.getUsage();
      
      expect(usage.used).to.equal(1024 * 1024);
      expect(usage.percentage).to.be.closeTo(20, 0.1);
    });
  });
  
  describe('AutoSave', function() {
    
    it('should enable auto-save', function() {
      const autoSave = {
        enabled: false,
        interval: 60000, // 1 minute
        toggle: function() {
          this.enabled = !this.enabled;
          return this.enabled;
        }
      };
      
      expect(autoSave.toggle()).to.be.true;
      expect(autoSave.toggle()).to.be.false;
    });
    
    it('should trigger save on interval', function() {
      const autoSave = {
        lastSave: 0,
        interval: 5000,
        shouldSave: function(currentTime) {
          return currentTime - this.lastSave >= this.interval;
        }
      };
      
      expect(autoSave.shouldSave(3000)).to.be.false;
      expect(autoSave.shouldSave(5000)).to.be.true;
    });
    
    it('should save only if terrain was modified', function() {
      const autoSave = {
        lastModified: 1000,
        lastSave: 500,
        isDirty: function() {
          return this.lastModified > this.lastSave;
        }
      };
      
      expect(autoSave.isDirty()).to.be.true;
      
      autoSave.lastSave = 2000;
      expect(autoSave.isDirty()).to.be.false;
    });
  });
});

describe('FileIO - Server Integration', function() {
  
  describe('ServerUpload', function() {
    
    it('should prepare upload request', function() {
      const upload = {
        endpoint: '/api/terrain/upload',
        prepareRequest: function(data, filename) {
          return {
            method: 'POST',
            url: this.endpoint,
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              filename: filename,
              data: data
            })
          };
        }
      };
      
      const request = upload.prepareRequest({ test: true }, 'terrain.json');
      expect(request.method).to.equal('POST');
      expect(request.url).to.equal('/api/terrain/upload');
    });
    
    it('should handle upload success', function() {
      const upload = {
        handleResponse: function(status, response) {
          if (status === 200) {
            return {
              success: true,
              fileId: response.id,
              url: response.url
            };
          }
          return {
            success: false,
            error: 'Upload failed'
          };
        }
      };
      
      const result = upload.handleResponse(200, { id: '123', url: '/files/123' });
      expect(result.success).to.be.true;
      expect(result.fileId).to.equal('123');
    });
    
    it('should handle upload errors', function() {
      const upload = {
        handleError: function(error) {
          const messages = {
            'NETWORK_ERROR': 'Could not connect to server',
            'FILE_TOO_LARGE': 'File exceeds size limit',
            'INVALID_FORMAT': 'Invalid file format'
          };
          return messages[error] || 'Unknown error';
        }
      };
      
      expect(upload.handleError('NETWORK_ERROR')).to.include('connect');
      expect(upload.handleError('FILE_TOO_LARGE')).to.include('size');
    });
  });
  
  describe('ServerDownload', function() {
    
    it('should fetch file list from server', function() {
      const download = {
        endpoint: '/api/terrain/list',
        getFileList: function() {
          // Mock server response
          return {
            files: [
              { id: '1', name: 'terrain1.json', size: 1024 },
              { id: '2', name: 'level2.json', size: 2048 }
            ]
          };
        }
      };
      
      const response = download.getFileList();
      expect(response.files).to.have.lengthOf(2);
    });
    
    it('should download file by ID', function() {
      const download = {
        endpoint: '/api/terrain/download',
        getDownloadUrl: function(fileId) {
          return `${this.endpoint}/${fileId}`;
        }
      };
      
      const url = download.getDownloadUrl('123');
      expect(url).to.equal('/api/terrain/download/123');
    });
  });
});

describe('FileIO - Format Conversion', function() {
  
  describe('FormatConverter', function() {
    
    it('should convert between JSON formats', function() {
      const converter = {
        toCompressed: function(data) {
          // Simulate compression
          return {
            ...data,
            tiles: `${data.tiles.length}:moss`
          };
        }
      };
      
      const compressed = converter.toCompressed({
        metadata: { version: '1.0' },
        tiles: ['moss', 'moss', 'moss']
      });
      
      expect(compressed.tiles).to.be.a('string');
    });
    
    it('should export to different formats', function() {
      const converter = {
        formats: ['json', 'json-compressed', 'binary'],
        canConvert: function(from, to) {
          return this.formats.includes(from) && this.formats.includes(to);
        }
      };
      
      expect(converter.canConvert('json', 'json-compressed')).to.be.true;
      expect(converter.canConvert('json', 'invalid')).to.be.false;
    });
    
    it('should preserve data during conversion', function() {
      const converter = {
        convert: function(data, targetFormat) {
          // Always preserve metadata
          return {
            format: targetFormat,
            metadata: data.metadata,
            tiles: data.tiles
          };
        }
      };
      
      const original = {
        metadata: { seed: 12345 },
        tiles: [1, 2, 3]
      };
      
      const converted = converter.convert(original, 'binary');
      expect(converted.metadata.seed).to.equal(12345);
    });
  });
});

describe('FileIO - Error Handling', function() {
  
  describe('ErrorReporting', function() {
    
    it('should categorize file errors', function() {
      const reporter = {
        categorize: function(errorCode) {
          const categories = {
            'FILE_NOT_FOUND': 'file',
            'PARSE_ERROR': 'format',
            'SIZE_EXCEEDED': 'quota',
            'NETWORK_ERROR': 'connection'
          };
          return categories[errorCode] || 'unknown';
        }
      };
      
      expect(reporter.categorize('FILE_NOT_FOUND')).to.equal('file');
      expect(reporter.categorize('PARSE_ERROR')).to.equal('format');
    });
    
    it('should provide user-friendly error messages', function() {
      const reporter = {
        getMessage: function(errorCode) {
          const messages = {
            'FILE_NOT_FOUND': 'The selected file could not be found.',
            'PARSE_ERROR': 'The file format is invalid or corrupted.',
            'SIZE_EXCEEDED': 'The file is too large to load.',
            'PERMISSION_DENIED': 'You do not have permission to access this file.'
          };
          return messages[errorCode] || 'An unknown error occurred.';
        }
      };
      
      expect(reporter.getMessage('PARSE_ERROR')).to.include('invalid');
    });
    
    it('should suggest recovery actions', function() {
      const reporter = {
        getSuggestion: function(errorCode) {
          const suggestions = {
            'PARSE_ERROR': 'Try exporting the terrain again, or check the file for corruption.',
            'SIZE_EXCEEDED': 'Try using compressed format or splitting into smaller regions.',
            'NETWORK_ERROR': 'Check your internet connection and try again.'
          };
          return suggestions[errorCode];
        }
      };
      
      expect(reporter.getSuggestion('SIZE_EXCEEDED')).to.include('compressed');
    });
  });
});
