# PowerShell script to update file paths in integration tests
# This script updates old Classes/ui/* paths to new Classes/ui/* structure

$mappings = @{
    # Dialog files moved to levelEditor/fileIO
    "Classes/ui/SaveDialog" = "Classes/ui/levelEditor/fileIO/SaveDialog"
    "Classes/ui/LoadDialog" = "Classes/ui/levelEditor/fileIO/LoadDialog"
    
    # Menu bar components moved to _baseObjects/bar/menuBar
    "Classes/ui/menuBar/BrushSizeMenuModule" = "Classes/ui/_baseObjects/bar/menuBar/BrushSizeMenuModule"
    "Classes/ui/FileMenuBar" = "Classes/ui/_baseObjects/bar/menuBar/FileMenuBar"
    
    # Painter components
    "Classes/ui/EntityPainter" = "Classes/ui/painter/entity/EntityPainter"
    "Classes/ui/painter/entity/EntityPainter" = "Classes/ui/painter/entity/EntityPainter"  # Already correct
    "Classes/ui/EntityPalette" = "Classes/ui/painter/entity/EntityPalette"
    "Classes/ui/painter/entity/EntityPalette" = "Classes/ui/painter/entity/EntityPalette"  # Already correct
    "Classes/ui/MaterialPalette" = "Classes/ui/painter/terrain/MaterialPalette"
    "Classes/ui/painter/terrain/MaterialPalette" = "Classes/ui/painter/terrain/MaterialPalette"  # Already correct
    
    # Toast notifications
    "Classes/ui/ToastNotification" = "Classes/ui/levelEditor/toastNotifications/ToastNotification"
    
    # Modal dialogs
    "Classes/ui/ModalDialog" = "Classes/ui/_baseObjects/modalWindow/ModalDialog"
    
    # Scroll components
    "Classes/ui/ScrollIndicator" = "Classes/ui/UIComponents/scroll/ScrollIndicator"
    "Classes/ui/ScrollableContentArea" = "Classes/ui/UIComponents/scroll/ScrollableContentArea"
    
    # Sidebar
    "Classes/ui/LevelEditorSidebar" = "Classes/ui/levelEditor/panels/LevelEditorSidebar"
    
    # Category components
    "Classes/ui/CategoryRadioButtons" = "Classes/ui/UIComponents/radioButton/CategoryRadioButtons"
    "Classes/ui/MaterialCategory" = "Classes/ui/painter/terrain/MaterialCategory"
    "Classes/ui/MaterialSearchBar" = "Classes/ui/painter/terrain/MaterialSearchBar"
    "Classes/ui/MaterialFavorites" = "Classes/ui/painter/terrain/MaterialFavorites"
    "Classes/ui/MaterialPreviewTooltip" = "Classes/ui/painter/terrain/MaterialPreviewTooltip"
    
    # Grid overlays
    "Classes/ui/DynamicGridOverlay" = "Classes/ui/UIComponents/DynamicGridOverlay"
    "Classes/ui/GridOverlay" = "Classes/ui/UIComponents/GridOverlay"
    "Classes/ui/MiniMap" = "Classes/ui/UIComponents/MiniMap"
    "Classes/ui/DynamicMinimap" = "Classes/ui/UIComponents/DynamicMinimap"
    
    # UI Objects
    "Classes/ui/UIObject" = "Classes/ui/_baseObjects/UIObject"
    "Classes/ui/PropertiesPanel" = "Classes/ui/levelEditor/panels/PropertiesPanel"
    
    # Tool components
    "Classes/ui/ToolBar" = "Classes/ui/_baseObjects/bar/toolBar/ToolBar"
    "Classes/ui/BrushSizeControl" = "Classes/ui/_baseObjects/brushes/BrushSizeControl"
    "Classes/ui/_baseObjects/bar/toolBar/BrushSizeControl" = "Classes/ui/_baseObjects/brushes/BrushSizeControl"
    "Classes/ui/EntitySelectionTool" = "Classes/ui/painter/entity/EntitySelectionTool"
    "Classes/ui/ToolModeToggle" = "Classes/ui/_baseObjects/bar/toolBar/ToolModeToggle"
    
    # Settings components
    "Classes/ui/components/Toggle" = "Classes/ui/UIComponents/Toggle"
    "Classes/ui/components/Slider" = "Classes/ui/UIComponents/Slider"
    "Classes/ui/SettingsPanel" = "Classes/ui/levelEditor/panels/SettingsPanel"
    
    # Event components
    "Classes/ui/EventPropertyWindow" = "Classes/ui/eventTemplates/EventPropertyWindow"
    
    # Selection and hover
    "Classes/ui/SelectionManager" = "Classes/ui/painter/entity/SelectionManager"
    "Classes/ui/HoverPreviewManager" = "Classes/ui/_baseObjects/brushes/HoverPreviewManager"
}

# Get all integration test files
$testFiles = Get-ChildItem -Path "test\integration" -Filter "*.test.js" -Recurse

Write-Host "Found $($testFiles.Count) test files to update" -ForegroundColor Cyan

$totalReplacements = 0

foreach ($file in $testFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $replacements = 0
    
    foreach ($oldPath in $mappings.Keys) {
        $newPath = $mappings[$oldPath]
        
        # Replace in require statements (with or without .js extension)
        $pattern1 = [regex]::Escape("require('../../../$oldPath")
        $replacement1 = "require('../../../$newPath"
        if ($content -match $pattern1) {
            $content = $content -replace $pattern1, $replacement1
            $replacements++
        }
        
        # Also handle cases without .js extension being added
        $pattern2 = [regex]::Escape("require('../../../$oldPath')")
        $replacement2 = "require('../../../$newPath')"
        if ($content -match $pattern2) {
            $content = $content -replace $pattern2, $replacement2
            $replacements++
        }
        
        $pattern3 = [regex]::Escape("require('../../../$oldPath.js')")
        $replacement3 = "require('../../../$newPath.js')"
        if ($content -match $pattern3) {
            $content = $content -replace $pattern3, $replacement3
            $replacements++
        }
    }
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "  Updated: $($file.Name) ($replacements replacements)" -ForegroundColor Green
        $totalReplacements += $replacements
    }
}

Write-Host "`nTotal replacements: $totalReplacements" -ForegroundColor Cyan
Write-Host "Done!" -ForegroundColor Green
