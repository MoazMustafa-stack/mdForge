import { useState, useCallback, useEffect } from "react";
import "./App.css";

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

// Loading Screen Component
interface LoadingScreenProps {
  isVisible: boolean;
  message?: string;
}

function LoadingScreen({ isVisible, message = "Generating Site..." }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(message);
  const [dots, setDots] = useState("");

  const loadingMessages = [
    "Initializing retro protocols...",
    "Compiling markdown matrices...",
    "Optimizing 90s aesthetics...",
    "Defragmenting content blocks...",
    "Loading pixel fonts...",
    "Calibrating CRT display...",
    "Establishing dialup connection...",
    "Rendering HTML tables...",
    "Processing GIF animations...",
    "Building site architecture...",
    "Finalizing generation..."
  ];

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      return;
    }

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev;
        const increment = Math.random() * 15 + 5;
        return Math.min(prev + increment, 95);
      });
    }, 400);

    const messageInterval = setInterval(() => {
      const randomMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
      setCurrentMessage(randomMessage);
    }, 1500);

    const dotsInterval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      clearInterval(dotsInterval);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-window">
        <div className="loading-titlebar">
          <span className="loading-title">mdForge - Theme Tester (Demo Mode)</span>
        </div>
        <div className="loading-content">
          <div className="loading-icon">⚙️</div>
          <div className="loading-message">
            {currentMessage}{dots}
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-outer">
              <div 
                className="progress-bar-inner" 
                style={{ width: `${progress}%` }}
              >
                <div className="progress-bar-stripes" />
              </div>
            </div>
            <div className="progress-text">{Math.floor(progress)}%</div>
          </div>
          <div className="loading-footer">
            <span className="loading-spinner">◐</span> Theme preview...
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [showLoadingScreen, setShowLoadingScreen] = useState(() => {
    const saved = localStorage.getItem('mdForge_showLoadingScreen');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("base");
  const [exportTitle, setExportTitle] = useState<string>("My Document");
  const [showFakeLoading, setShowFakeLoading] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [previewVisible, setPreviewVisible] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [wordCount, setWordCount] = useState(0);

  // Demo markdown content
  const [markdownContent, setMarkdownContent] = useState(`# Welcome to mdForge Theme Tester

This is a **live preview** of your markdown content with different themes.

## About This Demo

- **Demo Mode**: All buttons are functional for UI testing
- **No Backend**: File operations and generation are simulated
- **Theme Testing**: Switch templates to preview different styles
- **Interactive**: All menus and controls work normally

## Features Demonstrated

### Text Formatting
- *Italic text* using asterisks
- **Bold text** using double asterisks
- ***Bold and italic*** combined
- ~~Strikethrough~~ using double tildes

### Code Examples

\`\`\`javascript
// Example: JavaScript code block
function greet(name) {
  console.log(\`Hello, \${name}!\`);
  return name;
}

greet("Theme Tester");
\`\`\`

### Lists

**Unordered List:**
- Item 1
- Item 2
- Item 3

**Ordered List:**
1. First point
2. Second point
3. Third point

### Blockquote

> This is a blockquote that demonstrates how the theme handles
> emphasized content. Perfect for highlighting important information.

### Links and Images

[Visit mdForge GitHub](https://github.com/MoazMustafa-stack/mdForge)

### Horizontal Rule

---

## Try It Out!

1. **Change the template** using the dropdown in the Site Generator
2. **Edit the markdown** in the editor to see live updates
3. **Zoom in/out** using Ctrl+/Ctrl- to test responsiveness
4. **Toggle preview** to test editor-only mode
5. **Use keyboard shortcuts** (Ctrl+S, Ctrl+F, etc.) to test inputs

---

**Note:** This is a theme testing mode - no files will actually be saved or generated.
`);
  const [previewHtml, setPreviewHtml] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("Theme Tester - Demo Mode Active");
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // Clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Persist settings
  useEffect(() => {
    localStorage.setItem('mdForge_showLoadingScreen', JSON.stringify(showLoadingScreen));
  }, [showLoadingScreen]);

  // Render preview (simplified for demo)
  const renderPreview = useCallback(async () => {
    // Simple HTML rendering for demo
    const html = markdownContent
      .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
      .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
      .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/```[\s\S]*?```/g, '<pre><code>Code block</code></pre>')
      .replace(/^- (.*?)$/gm, '<li>$1</li>')
      .replace(/^> (.*?)$/gm, '<blockquote>$1</blockquote>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    
    setPreviewHtml(`<p>${html}</p>`);
  }, [markdownContent]);

  useEffect(() => {
    const debounceTimer = setTimeout(renderPreview, 300);
    return () => clearTimeout(debounceTimer);
  }, [markdownContent, renderPreview]);

  // Word count
  useEffect(() => {
    const words = markdownContent.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [markdownContent]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    if (activeDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeDropdown]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault();
            handleNewFile();
            break;
          case 'f':
            e.preventDefault();
            handleFind();
            break;
          case '=':
          case '+':
            e.preventDefault();
            handleZoomIn();
            break;
          case '-':
            e.preventDefault();
            handleZoomOut();
            break;
          case '0':
            e.preventDefault();
            handleResetZoom();
            break;
          default:
            // Ignore other shortcuts in demo mode
            break;
        }
      }
      
      if (e.key === 'Escape') {
        setActiveDropdown(null);
        setShowSearch(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Demo handlers
  const handleMenuClick = (menuName: string) => {
    setActiveDropdown(activeDropdown === menuName ? null : menuName);
  };

  const handleToggleLoadingScreen = () => {
    setShowLoadingScreen((prev: boolean) => !prev);
  };

  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  const handleOpenHelp = () => {
    setShowHelp(true);
  };

  const handleCloseHelp = () => {
    setShowHelp(false);
  };

  const handleNewFile = () => {
    setMarkdownContent("# New Document\n\nStart writing here...");
    setStatus("success");
    setStatusMessage("New document created (demo)");
    setActiveDropdown(null);
  };

  const handleFind = () => {
    setShowSearch(!showSearch);
    setActiveDropdown(null);
  };

  const handleTogglePreview = () => {
    setPreviewVisible(!previewVisible);
    setActiveDropdown(null);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2));
    setActiveDropdown(null);
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
    setActiveDropdown(null);
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setActiveDropdown(null);
  };

  const handleInsertDate = () => {
    const date = new Date().toLocaleDateString();
    setMarkdownContent(prev => prev + `\n\n${date}`);
    setActiveDropdown(null);
    setStatus("success");
    setStatusMessage("Date inserted");
  };

  const handleInsertTable = () => {
    const table = `\n\n| Header 1 | Header 2 | Header 3 |\n| -------- | -------- | -------- |\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n\n`;
    setMarkdownContent(prev => prev + table);
    setActiveDropdown(null);
    setStatus("success");
    setStatusMessage("Table inserted");
  };

  const handleClearContent = () => {
    if (confirm('Are you sure you want to clear all content?')) {
      setMarkdownContent('');
      setStatusMessage('Content cleared (demo)');
    }
    setActiveDropdown(null);
  };

  const handleDemoAction = (actionName: string) => {
    setStatus("success");
    setStatusMessage(`[DEMO] ${actionName} - No actual action performed`);
    setActiveDropdown(null);
    
    if (showLoadingScreen && actionName.includes("Generate")) {
      setShowFakeLoading(true);
      setTimeout(() => setShowFakeLoading(false), 3000);
    }
  };

  return (
    <div className="window-container">
      {/* Title Bar */}
      <div className="titlebar">
        <div className="titlebar-title">
          <span>mdForge - Theme Tester (Demo Mode)</span>
        </div>
        <div className="titlebar-controls">
          <button className="titlebar-btn" title="Minimize">_</button>
          <button className="titlebar-btn" title="Maximize">□</button>
          <button className="titlebar-btn close" title="Close">×</button>
        </div>
      </div>

      {/* Menu Bar */}
      <div className="menubar">
        <div className="menu-dropdown">
          <button className="menu-item" onClick={(e) => { e.stopPropagation(); handleMenuClick('file'); }}>
            <span>F</span>ile
          </button>
          {activeDropdown === 'file' && (
            <div className="dropdown-menu">
              <button className="dropdown-item" onClick={handleNewFile}>
                <span>📄</span> New (Ctrl+N)
              </button>
              <button className="dropdown-item" onClick={() => handleDemoAction("Open file")}>
                <span>📂</span> Open (Ctrl+O)
              </button>
              <button className="dropdown-item" onClick={() => handleDemoAction("Save file")}>
                <span>💾</span> Save (Ctrl+S)
              </button>
              <div className="dropdown-divider" />
              <button className="dropdown-item" onClick={() => handleDemoAction("Export HTML")}>
                <span>📤</span> Export HTML
              </button>
            </div>
          )}
        </div>
        
        <div className="menu-dropdown">
          <button className="menu-item" onClick={(e) => { e.stopPropagation(); handleMenuClick('edit'); }}>
            <span>E</span>dit
          </button>
          {activeDropdown === 'edit' && (
            <div className="dropdown-menu">
              <button className="dropdown-item" onClick={() => handleDemoAction("Undo")}>
                <span>↶</span> Undo (Ctrl+Z)
              </button>
              <button className="dropdown-item" onClick={() => handleDemoAction("Redo")}>
                <span>↷</span> Redo (Ctrl+Y)
              </button>
              <div className="dropdown-divider" />
              <button className="dropdown-item" onClick={() => handleDemoAction("Copy all")}>
                <span>📋</span> Copy All (Ctrl+A, Ctrl+C)
              </button>
              <div className="dropdown-divider" />
              <button className="dropdown-item" onClick={handleFind}>
                <span>🔍</span> Find (Ctrl+F)
              </button>
            </div>
          )}
        </div>
        
        <div className="menu-dropdown">
          <button className="menu-item" onClick={(e) => { e.stopPropagation(); handleMenuClick('view'); }}>
            <span>V</span>iew
          </button>
          {activeDropdown === 'view' && (
            <div className="dropdown-menu">
              <button className="dropdown-item" onClick={handleTogglePreview}>
                <span>{previewVisible ? '👁️‍🗨️' : '👁️'}</span> {previewVisible ? 'Hide' : 'Show'} Preview
              </button>
              <div className="dropdown-divider" />
              <button className="dropdown-item" onClick={handleZoomIn}>
                <span>🔍➕</span> Zoom In (Ctrl++)
              </button>
              <button className="dropdown-item" onClick={handleZoomOut}>
                <span>🔍➖</span> Zoom Out (Ctrl+-)
              </button>
              <button className="dropdown-item" onClick={handleResetZoom}>
                <span>🎯</span> Reset Zoom (Ctrl+0)
              </button>
              <div className="dropdown-divider" />
              <div className="dropdown-item-info">
                <span>📏</span> Zoom: {Math.round(zoomLevel * 100)}%
              </div>
            </div>
          )}
        </div>
        
        <div className="menu-dropdown">
          <button className="menu-item" onClick={(e) => { e.stopPropagation(); handleMenuClick('tools'); }}>
            <span>T</span>ools
          </button>
          {activeDropdown === 'tools' && (
            <div className="dropdown-menu">
              <button className="dropdown-item" onClick={handleInsertDate}>
                <span>📅</span> Insert Date
              </button>
              <button className="dropdown-item" onClick={handleInsertTable}>
                <span>📊</span> Insert Table
              </button>
              <div className="dropdown-divider" />
              <div className="dropdown-item-info">
                <span>📝</span> Word Count: {wordCount}
              </div>
              <div className="dropdown-divider" />
              <button className="dropdown-item danger" onClick={handleClearContent}>
                <span>🗑️</span> Clear All Content
              </button>
            </div>
          )}
        </div>
        
        <button className="menu-item" onClick={handleOpenSettings}>
          <span>S</span>ettings
        </button>
        <button className="menu-item" onClick={handleOpenHelp}>
          <span>H</span>elp
        </button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Left Panel - Theme Selector */}
        <div className="panel panel-left">
          <div className="panel-header">
            <span className="panel-icon">🎨</span>
            Theme Settings
          </div>
          <div className="panel-content">
            <fieldset className="fieldset-90s">
              <legend>Theme Selection</legend>
              
              <div className="form-group">
                <label className="form-label">Select Template Style:</label>
                <select
                  className="input-90s"
                  value={selectedTemplate}
                  onChange={(e) => {
                    setSelectedTemplate(e.target.value);
                    setStatus("success");
                    setStatusMessage(`Theme changed to: ${e.target.value}`);
                  }}
                  title="Switch between different theme templates"
                >
                  <option value="base">Base</option>
                  <option value="blog">Blog</option>
                  <option value="docs">Docs</option>
                </select>
              </div>

              <div className="template-info">
                <strong>Available Themes:</strong>
                <ul>
                  <li><strong>Base</strong> - Simple, clean layout for general pages</li>
                  <li><strong>Blog</strong> - Blog post layout with metadata support</li>
                  <li><strong>Docs</strong> - Documentation layout with sidebar</li>
                </ul>
              </div>
            </fieldset>

            <div className="divider" />

            <fieldset className="fieldset-90s">
              <legend>Export Settings</legend>
              
              <div className="form-group">
                <label className="form-label">Document Title:</label>
                <input
                  type="text"
                  className="input-90s"
                  value={exportTitle}
                  onChange={(e) => setExportTitle(e.target.value)}
                  placeholder="My Document"
                />
              </div>

              <button 
                className="btn-90s primary btn-full" 
                onClick={() => handleDemoAction("Export as HTML")}
              >
                <span>📤</span> Export as HTML (Demo)
              </button>

              <div className="setting-description">
                In demo mode, this button displays a message instead of exporting.
              </div>
            </fieldset>

            <div className="divider" />

            <fieldset className="fieldset-90s">
              <legend>Demo Mode Instructions</legend>
              
              <div className="setting-description">
                <strong>✓ What Works:</strong>
                <ul style={{ marginTop: '8px', fontSize: '0.9em' }}>
                  <li>All UI elements and menus</li>
                  <li>Markdown editor functionality</li>
                  <li>Live preview rendering</li>
                  <li>Theme switching</li>
                  <li>Zoom controls (Ctrl+/Ctrl-)</li>
                  <li>Keyboard shortcuts</li>
                </ul>
              </div>

              <div className="setting-description" style={{ marginTop: '12px' }}>
                <strong>✗ Demo Only:</strong>
                <ul style={{ marginTop: '8px', fontSize: '0.9em' }}>
                  <li>File operations (open, save, load)</li>
                  <li>Site generation</li>
                  <li>Directory browsing</li>
                  <li>HTML export</li>
                </ul>
              </div>
            </fieldset>
          </div>
        </div>

        {/* Right Panel - Editor & Preview */}
        <div className="panel panel-right" style={{ fontSize: `${zoomLevel}rem` }}>
          <div className="panel-header">
            Markdown Editor & Live Preview
            {showSearch && (
              <div className="search-bar">
                <input
                  type="text"
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  autoFocus
                />
                <button className="search-close" onClick={() => setShowSearch(false)}>×</button>
              </div>
            )}
          </div>
          <div className="panel-content column">
            {/* Markdown Editor */}
            <div className="flex-1">
              <label className="form-label" htmlFor="markdown-source">Markdown Source:</label>
              <textarea
                id="markdown-source"
                className="textarea-90s"
                value={markdownContent}
                onChange={(e) => setMarkdownContent(e.target.value)}
                placeholder="Write your markdown here..."
                title="Markdown source editor - edit and see live preview"
              />
            </div>

            {/* Preview */}
            {previewVisible && (
              <div className="flex-col-1">
                <label className="form-label">Live Preview ({selectedTemplate} theme):</label>
                <div
                  className="preview-container"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="statusbar">
        <div className="status-item">
          <span className={`status-indicator ${status}`} />
          <span>{statusMessage}</span>
        </div>
        <div className="status-item auto-left">
          <span>🎨</span>
          <span>Theme: {selectedTemplate}</span>
        </div>
        <div className="status-item">
          <span>⏰</span>
          <span>{currentTime}</span>
        </div>
      </div>

      {/* Loading Screen */}
      <LoadingScreen isVisible={showFakeLoading} />

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={handleCloseSettings}>
          <div className="settings-window" onClick={(e) => e.stopPropagation()}>
            <div className="settings-titlebar">
              <span className="settings-title">⚙️ Settings</span>
              <button className="titlebar-btn close" onClick={handleCloseSettings}>×</button>
            </div>
            <div className="settings-content">
              <fieldset className="fieldset-90s">                
                <label className="checkbox-90s">
                  <input 
                    type="checkbox" 
                    checked={showLoadingScreen}
                    onChange={handleToggleLoadingScreen}
                  />
                  <span>Show loading screen animation on theme preview</span>
                </label>
                
                <div className="setting-description">
                  When enabled, displays a retro loading screen when you trigger demo actions.
                </div>
              </fieldset>

              <div className="settings-footer">
                <button className="btn-90s primary" onClick={handleCloseSettings}>
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="modal-overlay" onClick={handleCloseHelp}>
          <div className="settings-window" onClick={(e) => e.stopPropagation()}>
            <div className="settings-titlebar">
              <span className="settings-title">❓ Theme Tester Help</span>
              <button className="titlebar-btn close" onClick={handleCloseHelp}>×</button>
            </div>
            <div className="settings-content">
              <fieldset className="fieldset-90s">
                <legend>About Theme Tester</legend>
                
                <div className="help-section">
                  <p><strong>Welcome to the mdForge Theme Tester!</strong></p>
                  <p>This is a demo mode for testing different markdown themes and UI styles without running the full Tauri backend.</p>
                </div>

                <div className="divider" style={{ margin: '12px 0' }} />

                <div className="help-section">
                  <p><strong>How to Use:</strong></p>
                  <ol style={{ marginLeft: '20px' }}>
                    <li>Edit the markdown in the left editor pane</li>
                    <li>Watch the live preview update in real-time (right pane)</li>
                    <li>Switch themes using the dropdown in the left panel</li>
                    <li>Use Ctrl+F to search content</li>
                    <li>Use Ctrl+/Ctrl- to zoom in/out</li>
                  </ol>
                </div>

                <div className="divider" style={{ margin: '12px 0' }} />

                <div className="help-section">
                  <p><strong>What This Is NOT:</strong></p>
                  <p>This is a UI/theme testing environment. File operations and site generation are simulated for demo purposes only. To use the full application with real file operations, run:</p>
                  <pre style={{ backgroundColor: '#f0f0f0', padding: '8px', borderRadius: '4px', overflow: 'auto' }}>
                    npm run dev
                  </pre>
                </div>
              </fieldset>

              <div className="settings-footer">
                <button className="btn-90s primary" onClick={handleCloseHelp}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
