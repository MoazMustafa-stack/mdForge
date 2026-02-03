# mdForge Theme Tester - Demo Mode

A standalone theme testing branch that lets you preview and test themes without running the Tauri backend.

## Current Branch
**`feature/theme-tester`** - Created for UI/theme testing and development

## Quick Start

### Option 1: Run Theme Tester (Demo Mode)
```bash
# Swap the App.tsx to use theme-tester version
mv src/App.tsx src/App.full.tsx
mv src/App.theme-tester.tsx src/App.tsx

# Install and run
npm install
npm run dev

# Visit: http://localhost:5173
```

### Option 2: Switch Back to Full App
```bash
# Swap back
mv src/App.tsx src/App.theme-tester.tsx
mv src/App.full.tsx src/App.tsx

# Run with backend
cargo tauri dev
```

## What Works in Theme Tester ✅

- **UI Testing**: All menus, buttons, dropdowns work
- **Markdown Editing**: Full markdown editor with live preview
- **Theme Switching**: Toggle between base, blog, and docs themes
- **Zoom Controls**: Ctrl+/Ctrl- for responsive testing
- **Keyboard Shortcuts**: Ctrl+N for new, Ctrl+F for find, Ctrl+0 for reset
- **Settings**: Loading screen toggle
- **Help**: Built-in documentation

## What's Simulated (Demo Only) ⚠️

These buttons show demo messages instead of actual actions:
- Open file
- Save file
- Load file
- Generate site
- Export HTML
- Browse directories

## File Structure

```
src/
├── App.tsx                (Full app with backend)
└── App.theme-tester.tsx   (Demo mode - theme testing)
src-tauri/
└── src/
    ├── lib.rs            (Tauri commands)
    ├── markdown_processor.rs
    └── ...
```

## Why Branch for This?

✅ **Isolation**: Keep theme testing separate from main development
✅ **Safety**: No risk of accidentally committing demo code
✅ **Workflow**: Easy to switch between `cargo tauri dev` and `npm run dev`
✅ **Collaboration**: Share theme testing without backend requirements

## Testing Themes

### Test the Base Theme
```
Theme selector (left panel) → Select "base"
Edit markdown below → See theme applied in live preview
```

### Test the Blog Theme
```
Theme selector (left panel) → Select "blog"
Note how the preview layout changes for blog posts
```

### Test the Docs Theme
```
Theme selector (left panel) → Select "docs"
Observe the documentation-focused layout
```

## Keyboard Shortcuts (All Work!)

| Shortcut | Action |
|----------|--------|
| Ctrl+N | New document |
| Ctrl+F | Find/Search |
| Ctrl++ | Zoom in |
| Ctrl+- | Zoom out |
| Ctrl+0 | Reset zoom |
| Escape | Close menus/search |

## Switch Back to Main Branch

```bash
# Commit your changes on feature/theme-tester first
git add .
git commit -m "Theme testing updates"

# Switch back to v1-release
git checkout v1-release

# Swap App files if needed
mv src/App.tsx src/App.theme-tester.tsx
mv src/App.full.tsx src/App.tsx
```

## Notes

- The theme tester uses mock data - no actual files are processed
- All styling is identical to the full app
- Perfect for designing and testing new themes
- Can be used for UX/UI testing and demos

---

**Status Bar** shows:
- Current status (success/error/idle)
- Active theme name
- Current time

Enjoy testing themes! 🎨
