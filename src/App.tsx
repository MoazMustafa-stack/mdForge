import { useState, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { getCurrentWindow } from "@tauri-apps/api/window";
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
  // Settings State (with localStorage persistence)
  const [showLoadingScreen, setShowLoadingScreen] = useState(() => {
    const saved = localStorage.getItem('mdForge_showLoadingScreen');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Export State
  const [selectedTemplate, setSelectedTemplate] = useState<string>("base");
  const [availableTemplates, setAvailableTemplates] = useState<string[]>(["base", "blog", "docs"]);
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
  const [markdownContent, setMarkdownContent] = useState(`# Welcome to mdForge

This is a **live preview** of your markdown content.

## Features

- Real-time markdown rendering
- Static site generation
- File management

\`\`\`javascript
const hello = "world";
console.log(hello);
\`\`\`
`);
  const [previewHtml, setPreviewHtml] = useState("");
  const [currentFile, setCurrentFile] = useState("");

  // Web Programming Course Paid off TT
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("Ready");
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // Theme state
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('mdForge_theme');
    return saved ?? "default";
  });

  // Drag and drop 
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessingDrop, setIsProcessingDrop] = useState(false);
  const [dragOverTarget, setDragOverTarget] = useState<'editor' | 'generator' | null>(null);

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

  // Persist theme setting
  useEffect(() => {
    localStorage.setItem('mdForge_theme', theme);
  }, [theme]);

  // Apply theme classes
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const appRoot = document.getElementById("root");
    const themeClasses = ["theme-dark", "theme-y2k"];

    root.classList.remove(...themeClasses);
    body.classList.remove(...themeClasses);
    appRoot?.classList.remove(...themeClasses);

    if (theme !== "default") {
      root.classList.add(theme);
      body.classList.add(theme);
      appRoot?.classList.add(theme);
    }
  }, [theme]);

  // Tauri file drop event listener
  useEffect(() => {
    const appWindow = getCurrentWindow();
    let unlisten: (() => void) | undefined;

    const setupDropListener = async () => {
      unlisten = await appWindow.onDragDropEvent(async (event) => {
        if (event.payload.type === 'drop') {
          const paths = event.payload.paths;
          
          // Clear drag states immediately when drop happens
          setIsDragOver(false);
          setDragOverTarget(null);
          
          if (paths.length === 0) return;
          
          // Determine which target based on dragOverTarget or default to editor
          const target = dragOverTarget || 'editor';
          const filePath = paths[0];
          
          if (target === 'editor') {
            await handleDropToEditor(filePath);
          } else if (target === 'generator') {
            await handleDropToGenerator(filePath);
          }
        } else if (event.payload.type === 'over') {
          setIsDragOver(true);
        } else if (event.payload.type === 'leave') {
          setIsDragOver(false);
          setDragOverTarget(null);
        }
      });
    };

    setupDropListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [dragOverTarget]);

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

  const handleDragOver = useCallback((e: React.DragEvent, target: 'editor' | 'generator') => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
    setDragOverTarget(target);
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragOver(false);
      setDragOverTarget(null);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, target: 'editor' | 'generator') => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragOverTarget(null);
    
    // Store the target for when Tauri file-drop event fires
    // The actual file paths come from Tauri's onDragDropEvent
    setStatus("idle");
    setStatusMessage(`Processing drop on ${target}...`);
  }, []);

  const handleDropToEditor = async (filePath: string) => {
    if (!filePath.match(/\.(md|markdown|txt)$/i)) {
      setStatus("error");
      setStatusMessage("Drop a markdown file (.md, .markdown, .txt)");
      return;
    }

    setIsProcessingDrop(true);
    try {
      const content = await invoke<string>("load_file", {
        path: filePath,
      });

      setMarkdownContent(content);
      setCurrentFile(filePath);
      setStatus("success");
      const fileName = filePath.split(/[\\/]/).pop() || filePath;
      setStatusMessage(`Loaded: ${fileName}`);
    } catch (error) {
      setStatus("error");
      setStatusMessage(`Failed to load file: ${error}`);
    } finally {
      setIsProcessingDrop(false);
    }
  };

  const handleDropToGenerator = async (filePath: string) => {
    setIsProcessingDrop(true);
    try {
      const isDirectory = await invoke<boolean>("is_directory", {
        path: filePath,
      });

      const fileName = filePath.split(/[\\/]/).pop() || filePath;

      if (isDirectory) {
        setInputDir(filePath);
        setStatus("success");
        setStatusMessage(`Input directory set: ${fileName}`);
      } else if (filePath.match(/\.(md|markdown)$/i)) {
        const parentDir = filePath.split(/[\\/]/).slice(0, -1).join('/') || "";
        setInputDir(parentDir);
        setStatus("success");
        setStatusMessage(`Input directory set from file: ${fileName}`);
      } else {
        setStatus("error");
        setStatusMessage("Drop a directory or markdown file");
      }
    } catch (error) {
      setStatus("error");
      setStatusMessage(`Drop failed: ${error}`);
    } finally {
      setIsProcessingDrop(false);
    }
  };

  // TODO: Fix GitHub repo opening - plugin-opener API needs investigation
  // const handleOpenGitHub = async () => {
  //   try {
  //     const opener = await import("@tauri-apps/plugin-opener");
  //     await opener.open("https://github.com/MoazMustafa-stack/mdForge");
  //     setStatus("success");
  //     setStatusMessage("Opened GitHub repository");
  //   } catch (error) {
  //     console.error("Failed to open URL:", error);
  //     setStatus("error");
  //     setStatusMessage("Failed to open GitHub");
  //   }
  // };

  const handleDownloadCheatsheet = async () => {
    try {
      // Embedded cheatsheet content
      const cheatsheet = `# Markdown Cheatsheet

## Headers
# H1
## H2
### H3

## Emphasis
*Italic* or _Italic_
**Bold** or __Bold__
***Bold and Italic***
~~Strikethrough~~

## Lists
### Unordered
* Item 1
* Item 2
  * Subitem 2.1

### Ordered
1. First
2. Second

## Links
[GitHub](https://github.com)

## Images
![Alt Text](https://via.placeholder.com/150)

## Code
\`Inline Code\`

\`\`\`javascript
// Code Block
console.log("Hello World");
\`\`\`

## Blockquotes
> This is a blockquote.

## Tables
| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |
`;

      // Ask user where to save
      const filePath = await save({
        defaultPath: "markdown-cheatsheet.md",
        filters: [{
          name: "Markdown",
          extensions: ["md"]
        }]
      });

      if (filePath) {
        await invoke("save_file", {
          path: filePath,
          content: cheatsheet
        });
        setStatus("success");
        setStatusMessage("Cheatsheet downloaded successfully");
      }
    } catch (error) {
      console.error("Download error:", error);
      setStatus("error");
      setStatusMessage("Failed to download cheatsheet");
    }
  }

  // Render live preview
  const renderPreview = useCallback(async () => {
    try {
      // Check if running in Tauri environment
      if (typeof window !== 'undefined' && !window.__TAURI_INTERNALS__) {
        setPreviewHtml("<p><em>Preview available only in Tauri app. Run: npm run tauri dev</em></p>");
        return;
      }
      
      const html = await invoke<string>("render_markdown_simple", {
        markdownContent: markdownContent,
      });
      setPreviewHtml(html);
    } catch (error) {
      console.error("Preview error:", error);
      setPreviewHtml("<p>Error rendering preview</p>");
    }
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
          case 'o':
            e.preventDefault();
            handleOpenFile();
            break;
          case 's':
            e.preventDefault();
            handleSaveFile();
            break;
          case 'f':
            e.preventDefault();
            handleFind();
            break;
          case 'a':
            if (e.target instanceof HTMLTextAreaElement) {
              // Let default behavior handle select all in textarea
              return;
            }
            e.preventDefault();
            handleSelectAll();
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
        }
      }
      
      // Escape key to close dropdowns and search
      if (e.key === 'Escape') {
        setActiveDropdown(null);
        setShowSearch(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Generate site
  const handleGenerateSite = async () => {
    if (!inputDir || !outputDir) {
      setStatus("error");
      setStatusMessage("Please specify input and output directories");
      return;
    }

    setIsGenerating(true);
    setStatus("idle");
    setStatusMessage("Generating site...");

    // Show fake loading screen if enabled
    if (showLoadingScreen) {
      setShowFakeLoading(true);
      const minLoadingTime = 2000 + Math.random() * 2000;
      await new Promise(resolve => setTimeout(resolve, minLoadingTime));
    }

    try {
      const result = await invoke<SiteGenerationReport>("generate_site_simple", {
        inputDir,
        outputDir,
      });
      console.log("Generation result:", result);
      setReport(result);
      setStatus("success");
      setStatusMessage(`Generated ${result.markdown_files_processed} files`);
    } catch (error) {
      console.error("Generation error:", error);
      setStatus("error");
      setStatusMessage(`Error: ${String(error)}`);
      setReport(null);
    } finally {
      setShowFakeLoading(false);
      setIsGenerating(false);
    }
  };

  // Save file
  const handleSaveFile = async () => {
    if (!currentFile) {
      setStatus("error");
      setStatusMessage("No file path specified");
      return;
    }

    try {
      await invoke("save_file", {
        path: currentFile,
        content: markdownContent,
      });
      setStatus("success");
      setStatusMessage("File saved successfully");
    } catch (error) {
      setStatus("error");
      setStatusMessage(`Save error: ${error}`);
    }
  };

  // Open file
  const handleOpenFile = async () => {
    try {
      const filePath = await open({
        filters: [{
          name: "Markdown",
          extensions: ["md", "markdown", "txt"]
        }]
      });

      if (filePath) {
        const content = await invoke<string>("load_file", {
          path: filePath,
        });
        setMarkdownContent(content);
        setCurrentFile(filePath as string);
        setStatus("success");
        setStatusMessage("File loaded successfully");
      }
    } catch (error) {
      setStatus("error");
      setStatusMessage(`Open error: ${error}`);
    }
  };

  // Browse for input directory
  const handleBrowseInput = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });
      if (selected && typeof selected === "string") {
        setInputDir(selected);
      }
    } catch (error) {
      console.error("Browse input error:", error);
      setStatus("error");
      setStatusMessage("Failed to select input directory");
    }
  };

  // Browse for output directory
  const handleBrowseOutput = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });
      if (selected && typeof selected === "string") {
        setOutputDir(selected);
      }
    } catch (error) {
      console.error("Browse output error:", error);
      setStatus("error");
      setStatusMessage("Failed to select output directory");
    }
  };

  // Load file
  const handleLoadFile = async () => {
    if (!currentFile) {
      setStatus("error");
      setStatusMessage("No file path specified");
      return;
    }

    try {
      const content = await invoke<string>("load_file", {
        path: currentFile,
      });
      setMarkdownContent(content);
      setStatus("success");
      setStatusMessage("File loaded successfully");
    } catch (error) {
      setStatus("error");
      setStatusMessage(`Load error: ${error}`);
    }
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdownContent);
      setStatusMessage('Content copied to clipboard');
    } catch (error) {
      setStatusMessage('Failed to copy content');
    }
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

  // Load available templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templates = await invoke<string[]>("get_available_templates");
        setAvailableTemplates(templates);
      } catch (error) {
        console.error("Failed to load templates:", error);
      }
    };
    loadTemplates();
  }, []);

  // Export as HTML with template
  const handleExportAsHtml = async () => {
    try {
      const filePath = await save({
        defaultPath: `${exportTitle || "document"}.html`,
        filters: [{
          name: "HTML",
          extensions: ["html"]
        }]
      });

      if (filePath) {
        const result = await invoke<string>("export_as_html", {
          markdownContent: markdownContent,
          title: exportTitle || null,
          templateName: selectedTemplate,
          outputPath: filePath,
        });
        
        setStatus("success");
        setStatusMessage(result);
      }
    } catch (error) {
      console.error("Export error details:", error);
      setStatus("error");
      
      // Better error message extraction
      let errorMsg = "Export failed";
      if (typeof error === 'string') {
        errorMsg = error;
      } else if (error && typeof error === 'object') {
        // Extract message from Tauri error object
        errorMsg = (error as any).message || (error as any).toString() || JSON.stringify(error);
      }
      
      setStatusMessage(`Export failed: ${errorMsg}`);
    }
  };

  return (
    <div className="window-container">
      {/* Title Bar */}
      <div className="titlebar">
        <div className="titlebar-title">
          <span>mdForge - Markdown Site Generator</span>
          {/*<span className="titlebar-theme">Theme: {theme === "default" ? "90s" : theme === "theme-dark" ? "Dark" : "Y2K"}</span>*/}
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
        <div
          className={`panel panel-left${isDragOver && dragOverTarget === 'generator' ? ' drag-over' : ''}${isProcessingDrop ? ' processing-drop' : ''}`}
          onDragOver={(e) => handleDragOver(e, 'generator')}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'generator')}
        >
          <div className="panel-header">
            <span className="panel-icon">⚙️</span>
            Site Generator
            <span className="dropzone-hint">Drop a folder or .md file</span>
          </div>
          {isDragOver && dragOverTarget === 'generator' && (
            <div className="drop-overlay">
              <div className="drop-overlay-content">
                <div className="drop-overlay-icon">📁</div>
                <div className="drop-overlay-title">Drop to set input directory</div>
                <div className="drop-overlay-subtitle">Folder or markdown file</div>
              </div>
            </div>
          )}
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
        <div
          className={`panel panel-right${isDragOver && dragOverTarget === 'editor' ? ' drag-over' : ''}${isProcessingDrop ? ' processing-drop' : ''}`}
          style={{ fontSize: `${zoomLevel}rem` }}
          onDragOver={(e) => handleDragOver(e, 'editor')}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'editor')}
        >
          <div className="panel-header">
            Markdown Editor & Live Preview
            <span className="dropzone-hint">Drop a .md file to open</span>
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
          {isDragOver && dragOverTarget === 'editor' && (
            <div className="drop-overlay">
              <div className="drop-overlay-content">
                <div className="drop-overlay-icon">📄</div>
                <div className="drop-overlay-title">Drop to load markdown</div>
                <div className="drop-overlay-subtitle">.md, .markdown, .txt</div>
              </div>
            </div>
          )}
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
                <label className="form-label"> Live Preview:</label>
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

              <fieldset className="fieldset-90s">
                <legend>🎨 Theme</legend>
                <div className="form-group">
                  <label className="form-label">Select Theme:</label>
                  <select
                    className="input-90s"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    title="Select application theme"
                  >
                    <option value="default">90s Classic</option>
                    <option value="theme-dark">Dark Mode</option>
                    <option value="theme-y2k">Y2K Aesthetic</option>
                  </select>
                </div>
                <div className="setting-description">
                  Choose your preferred visual theme. Changes are applied immediately.
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
                
                {/* TODO: Re-enable when GitHub opener is fixed */}
                {/* <div className="help-section">
                  <button className="btn-90s btn-full" onClick={handleOpenGitHub}>
                    <span></span> View GitHub Repository
                  </button>
                  <div className="setting-description">
                    Visit the mdForge repository for source code, issues, and contributions.
                  </div>
                </div>

                <div className="divider" /> */}

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
