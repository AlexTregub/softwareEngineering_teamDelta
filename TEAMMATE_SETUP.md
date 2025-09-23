# 🐜 Ant Game - Teammate Setup Guide

## 🚀 Quick Start (2 minutes)

1. **Clone and Navigate:**
   ```bash
   git clone <repository-url>
   cd softwareEngineering_teamDelta
   ```

2. **Start Local Server:**
   ```bash
   # Python (recommended)
   python -m http.server 8000
   
   # OR Node.js
   npx serve -l 8000
   ```

3. **Open Game:**
   - 🎮 **Play Game:** http://localhost:8000
   - 🧪 **Run Tests:** http://localhost:8000?test=true

4. **Verify Setup:**
   - Open browser console (F12)
   - Should see: "🎉 All scripts loaded successfully"
   - Run `validateSetup()` for detailed check

## 🔧 How It Works

### New Script Loading System
We've implemented a smart script loader that:
- ✅ **Auto-detects environment** (production/development/test)
- ✅ **Loads only needed scripts** (no more 20+ script tags!)
- ✅ **Preserves dependency order** (no race conditions)
- ✅ **Shows progress** with loading bar
- ✅ **Handles errors gracefully**

### Environment Modes
- **Production:** Core game files only (fastest)
- **Development:** Core + debug tools (localhost auto-detected)
- **Test:** Everything including test suites (`?test=true`)

## 🛠️ Development Tools

Open browser console and try:
```javascript
// Check if all files loaded correctly
validateSetup()

// List all scripts for current environment  
listScripts()

// Show loading performance
analyzeLoading()

// Switch to test environment
switchEnv("test")

// Add new script to a group
addScript("debug", "path/to/newScript.js")

// Check naming convention issues
checkNamingConventions()

// Fix naming convention problems
fixNaming()

// Test PascalCase fallback
testPascalCaseFallback("myScript.js")
```

## 📁 File Structure

The loader expects this structure:
```
├── index.html (clean, just 2 script tags!)
├── scripts/
│   ├── config.js (script configuration)
│   ├── loader.js (smart loading system)
│   ├── utils.js (management tools)
│   └── validator.js (teammate compatibility)
├── Classes/ (game code)
├── debug/ (development tools)
├── test/ (test suites)
└── TypeTests/ (type checking utilities)
```

## ⚠️ Common Issues & Solutions

### "Scripts won't load" 
- ✅ **Solution:** Use local server, not file:// protocol
- ✅ **Check:** Run `validateSetup()` in console
- ✅ **Auto-fix:** Script loader tries PascalCase versions automatically

### "CORS errors"
- ✅ **Solution:** Start local server: `python -m http.server 8000`
- ✅ **Avoid:** Opening index.html directly in browser

### "Some files missing"
- ✅ **Solution:** Make sure you have latest commit from repository
- ✅ **Check:** `validateSetup()` will list missing files
- ✅ **Naming:** Run `fixNaming()` to check for camelCase vs PascalCase issues

### "Loading hangs"
- ✅ **Solution:** Check browser console for red error messages
- ✅ **Debug:** Use `analyzeLoading()` to see what failed
- ✅ **Naming:** Check if files exist with different capitalization

## 🔄 For Team Leads

### Adding New Scripts:
1. Add to appropriate group in `scripts/config.js`
2. Or use `addScript("groupName", "path/to/script.js")` in console

### Managing Environments:
- **Production builds:** Only core files load
- **Development:** Debug tools included automatically
- **Testing:** All test suites included with `?test=true`

### Validating Changes:
```javascript
// Check all teammates can load files
validateSetup()

// Generate setup checklist for new teammates
new LoaderValidator().generateTeammateChecklist()
```

## 🆘 Getting Help

1. **First:** Run `validateSetup()` in browser console
2. **Check:** Browser console for error messages (F12)
3. **Verify:** All files present in your local copy
4. **Contact:** Team lead with console output if stuck

## 📈 Benefits

- ✅ **Cleaner codebase:** index.html went from 20+ script tags to 2
- ✅ **Faster loading:** Only loads scripts needed for environment
- ✅ **Better debugging:** Built-in tools and error handling
- ✅ **Easier maintenance:** Central configuration for all scripts
- ✅ **Teammate-friendly:** Auto-validation and clear setup instructions

---

**Need help?** Run `validateSetup()` in browser console for detailed diagnostics! 🔧