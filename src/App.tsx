import { useState, useCallback, useEffect } from "react";
import "./App.css";

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

interface SiteGenerationReport {
  markdown_files_processed: number;
  markdown_files_failed: number;
  assets_copied: number;
  assets_failed: number;
  errors: string[];
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

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev;
        const increment = Math.random() * 15 + 5;
        return Math.min(prev + increment, 95);
      });
    }, 400);

    // Random loading messages
    const messageInterval = setInterval(() => {
      const randomMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
      setCurrentMessage(randomMessage);
    }, 1500);

    // Dots animation
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
          <span className="loading-title">mdForge - Site Generation</span>
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
            <span className="loading-spinner">◐</span> Please wait...
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  // Title Bar
  const [showLoadingScreen, setShowLoadingScreen] = useState(() => {
    const saved = localStorage.getItem('mdForge_showLoadingScreen');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Export State
  const [selectedTemplate, setSelectedTemplate] = useState<string>("base");
  const [availableTemplates] = useState<string[]>(["base", "blog", "docs"]);
  const [exportTitle, setExportTitle] = useState<string>("");

  // Site Generator State
  const [inputDir, setInputDir] = useState("");
  const [outputDir, setOutputDir] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFakeLoading, setShowFakeLoading] = useState(false);
  const [report, setReport] = useState<SiteGenerationReport | null>(null);

  // Menu dropdown states
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  // View states
  const [zoomLevel, setZoomLevel] = useState(1);
  const [previewVisible, setPreviewVisible] = useState(true);
  
  // Edit functionality
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  // Tools states
  const [wordCount, setWordCount] = useState(0);

  // Markdown Editor State
  const [markdownContent, setMarkdownContent] = useState(`# Welcome to mdForge - Theme Tester

This is a **demo-only version** for testing themes and UI.

## Demo Mode Features

- Real-time markdown rendering
- All UI buttons and menus
- Demo status messages instead of actual operations
- Theme switching

## Supported Markdown

\`\`\`javascript
const hello = "world";
console.log(hello);
\`\`\`
`);
  const [previewHtml, setPreviewHtml] = useState("");
  const [currentFile, setCurrentFile] = useState("");

  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("Ready - Demo Mode");
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Persist loading screen setting
  useEffect(() => {
    localStorage.setItem('mdForge_showLoadingScreen', JSON.stringify(showLoadingScreen));
  }, [showLoadingScreen]);

  // Toggle settings handlers
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

  // Simple markdown rendering for demo
  const renderPreview = useCallback(() => {
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
    const debounceTimer = setTimeout(() => {
      renderPreview();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [markdownContent, renderPreview]);

  // Update word count when content changes
  useEffect(() => {
    const words = markdownContent.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [markdownContent]);

  // Close dropdown when clicking outside
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
  const handleGenerateSite = () => {
    if (!inputDir || !outputDir) {
      setStatus("error");
      setStatusMessage("Please specify input and output directories");
      return;
    }

    setIsGenerating(true);
    setStatus("idle");
    setStatusMessage("Generating site...");

    if (showLoadingScreen) {
      setShowFakeLoading(true);
      setTimeout(() => {
        setShowFakeLoading(false);
        const mockReport: SiteGenerationReport = {
          markdown_files_processed: 5,
          markdown_files_failed: 0,
          assets_copied: 12,
          assets_failed: 0,
          errors: [],
        };
        setReport(mockReport);
        setStatus("success");
        setStatusMessage("[DEMO] Generated 5 files - No actual backend");
        setIsGenerating(false);
      }, 3000);
    } else {
      const mockReport: SiteGenerationReport = {
        markdown_files_processed: 5,
        markdown_files_failed: 0,
        assets_copied: 12,
        assets_failed: 0,
        errors: [],
      };
      setReport(mockReport);
      setStatus("success");
      setStatusMessage("[DEMO] Generated 5 files - No actual backend");
      setIsGenerating(false);
    }
  };

  // Save file (demo)
  const handleSaveFile = () => {
    setStatus("success");
    setStatusMessage("[DEMO] File saved - No backend");
  };

  // Open file (demo)
  const handleOpenFile = () => {
    setStatus("success");
    setStatusMessage("[DEMO] Open file - No backend");
  };

  // Browse for input directory (demo)
  const handleBrowseInput = () => {
    setStatus("success");
    setStatusMessage("[DEMO] Browse directory - No backend");
  };

  // Browse for output directory (demo)
  const handleBrowseOutput = () => {
    setStatus("success");
    setStatusMessage("[DEMO] Browse directory - No backend");
  };

  // Load file (demo)
  const handleLoadFile = () => {
    setStatus("success");
    setStatusMessage("[DEMO] File loaded - No backend");
  };

  // New file
  const handleNewFile = () => {
    setMarkdownContent("# New Document\n\nStart writing here...");
    setCurrentFile("");
    setStatus("idle");
    setStatusMessage("New document created");
    setActiveDropdown(null);
  };

  // Menu dropdown handlers
  const handleMenuClick = (menuName: string) => {
    setActiveDropdown(activeDropdown === menuName ? null : menuName);
  };

  // Edit menu handlers
  const handleUndo = () => {
    document.execCommand('undo');
    setActiveDropdown(null);
  };

  const handleRedo = () => {
    document.execCommand('redo');
    setActiveDropdown(null);
  };

  const handleSelectAll = () => {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.select();
    }
    setActiveDropdown(null);
  };

  const handleFind = () => {
    setShowSearch(!showSearch);
    setActiveDropdown(null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownContent);
    setStatusMessage('Content copied to clipboard');
    setActiveDropdown(null);
  };

  // View menu handlers
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

  // Tools menu handlers
  const handleInsertDate = () => {
    const date = new Date().toLocaleDateString();
    setMarkdownContent(prev => prev + `\n\n${date}`);
    setActiveDropdown(null);
  };

  const handleInsertTable = () => {
    const table = `\n\n| Header 1 | Header 2 | Header 3 |\n| -------- | -------- | -------- |\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n\n`;
    setMarkdownContent(prev => prev + table);
    setActiveDropdown(null);
  };

  const handleClearContent = () => {
    if (confirm('Are you sure you want to clear all content?')) {
      setMarkdownContent('');
      setCurrentFile('');
      setStatusMessage('Content cleared');
    }
    setActiveDropdown(null);
  };

  // Load available templates (demo - static list)
  // In real app, this would call backend

  // Export as HTML (demo)
  const handleExportAsHtml = () => {
    setStatus("success");
    setStatusMessage("[DEMO] Export HTML - No backend");
    setActiveDropdown(null);
  };

  // Download cheatsheet (demo)
  const handleDownloadCheatsheet = () => {
    setStatus("success");
    setStatusMessage("[DEMO] Download cheatsheet - No backend");
    setActiveDropdown(null);
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
              <button className="dropdown-item" onClick={handleOpenFile}>
                <span>📂</span> Open (Ctrl+O)
              </button>
              <button className="dropdown-item" onClick={handleSaveFile}>
                <span>💾</span> Save (Ctrl+S)
              </button>
              <div className="dropdown-divider" />
              <button className="dropdown-item" onClick={handleExportAsHtml}>
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
              <button className="dropdown-item" onClick={handleUndo}>
                <span>↶</span> Undo (Ctrl+Z)
              </button>
              <button className="dropdown-item" onClick={handleRedo}>
                <span>↷</span> Redo (Ctrl+Y)
              </button>
              <div className="dropdown-divider" />
              <button className="dropdown-item" onClick={handleCopy}>
                <span>📋</span> Copy All (Ctrl+A, Ctrl+C)
              </button>
              <button className="dropdown-item" onClick={handleSelectAll}>
                <span>🔘</span> Select All (Ctrl+A)
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
        {/* Left Panel - Site Generator */}
        <div className="panel panel-left">
          <div className="panel-header">
            <span className="panel-icon">⚙️</span>
            Site Generator
          </div>
          <div className="panel-content">
            {/* Directory Settings */}
            <fieldset className="fieldset-90s">
              <legend>📁 Directories</legend>
              
              <div className="form-group">
                <label className="form-label">Input Directory:</label>
                <div className="file-path-display">
                  <input
                    type="text"
                    className="input-90s"
                    value={inputDir}
                    onChange={(e) => setInputDir(e.target.value)}
                    placeholder="./content"
                  />
                    <button className="btn-90s" title="Browse" onClick={handleBrowseInput}>📂</button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Output Directory:</label>
                <div className="file-path-display">
                  <input
                    type="text"
                    className="input-90s"
                    value={outputDir}
                    onChange={(e) => setOutputDir(e.target.value)}
                    placeholder="./dist"
                  />
                  <button className="btn-90s" title="Browse" onClick={handleBrowseOutput}>📂</button>
                </div>
              </div>
            </fieldset>

            {/* Generate Button */}
            <button
              className="btn-90s primary btn-full"
              onClick={handleGenerateSite}
              disabled={isGenerating}
            >
              {isGenerating ? "Generating..." : "Generate Site"}
            </button>

            {/* Generation Report */}
            {report && (
              <div className="generation-report">
                <div className="report-header">
                  Generation Report
                </div>
                <div className="report-item">
                  <span className="report-label">Markdown Files:</span>
                  <span>{report.markdown_files_processed} processed</span>
                </div>
                <div className="report-item">
                  <span className="report-label">Assets:</span>
                  <span>{report.assets_copied} copied</span>
                </div>
                {report.markdown_files_failed > 0 && (
                  <div className="report-item">
                    <span className="report-label">Failed:</span>
                    <span className="report-count error">{report.markdown_files_failed} markdown</span>
                  </div>
                )}
                {report.assets_failed > 0 && (
                  <div className="report-item">
                    <span className="report-label">Assets Failed:</span>
                    <span className="report-count error">{report.assets_failed}</span>
                  </div>
                )}
                {report.errors && report.errors.length > 0 && (
                  <div className="report-item">
                    <span className="report-label">Errors:</span>
                    <span className="report-count error">{report.errors.length}</span>
                  </div>
                )}
              </div>
            )}

            <div className="divider" />

            {/* File Operations */}
            <fieldset className="fieldset-90s">
              <legend>📄 Current File</legend>
              
              <div className="form-group">
                <label className="form-label">File Path:</label>
                <input
                  type="text"
                  className="input-90s"
                  value={currentFile}
                  onChange={(e) => setCurrentFile(e.target.value)}
                  placeholder="./content/page.md"
                />
              </div>

              <div className="btn-group">
                <button className="btn-90s" onClick={handleNewFile}>
                  <span>🆕</span> New
                </button>
                <button className="btn-90s" onClick={handleLoadFile}>
                  <span>📂</span> Load
                </button>
                <button className="btn-90s secondary" onClick={handleSaveFile}>
                  <span>💾</span> Save
                </button>
              </div>
            </fieldset>

            <div className="divider" />

            {/* Export Section */}
            <fieldset className="fieldset-90s">
              <legend>Export as HTML</legend>
              
              <div className="form-group">
                <label className="form-label">Template Style:</label>
                <select
                  className="input-90s"
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  title="Select template style for HTML export"
                >
                  {availableTemplates.map((template) => (
                    <option key={template} value={template}>
                      {template.charAt(0).toUpperCase() + template.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Document Title (optional):</label>
                <input
                  type="text"
                  className="input-90s"
                  value={exportTitle}
                  onChange={(e) => setExportTitle(e.target.value)}
                  placeholder="Auto-detect from markdown"
                />
              </div>

              <button className="btn-90s primary btn-full" onClick={handleExportAsHtml}>
                <span>📤</span> Export as HTML
              </button>

              <div className="template-info">
                <strong>Templates:</strong>
                <ul>
                  <li><strong>Base</strong> - Simple, clean layout</li>
                  <li><strong>Blog</strong> - Blog post with metadata</li>
                  <li><strong>Docs</strong> - Documentation with sidebar</li>
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
              <label className="form-label" htmlFor="markdown-source"> Markdown Source:</label>
              <textarea
                id="markdown-source"
                className="textarea-90s"
                value={markdownContent}
                onChange={(e) => setMarkdownContent(e.target.value)}
                placeholder="Write your markdown here..."
                title="Markdown source editor"
              />
            </div>

            {/* Preview - Conditionally rendered */}
            {previewVisible && (
              <div className="flex-col-1">
                <label className="form-label"> Live Preview ({selectedTemplate} theme):</label>
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
          <span>📁</span>
          <span>{currentFile || "Untitled"}</span>
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
                  <span>Show loading screen during site generation</span>
                </label>
                
                <div className="setting-description">
                  When enabled, displays a retro loading screen with progress bar
                  and status messages during site generation.
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
              <span className="settings-title">❓ Help & Resources</span>
              <button className="titlebar-btn close" onClick={handleCloseHelp}>×</button>
            </div>
            <div className="settings-content">
              <fieldset className="fieldset-90s">
                <legend>Resources</legend>
                
                <div className="help-section">
                  <button className="btn-90s secondary btn-full" onClick={handleDownloadCheatsheet}>
                    <span>📄</span> Download Markdown Cheatsheet
                  </button>
                  <div className="setting-description">
                    Get a quick reference guide for all supported Markdown syntax.
                  </div>
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
