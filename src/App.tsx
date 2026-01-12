import { useState, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
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

function App() {
  // Site Generator State
  const [inputDir, setInputDir] = useState("");
  const [outputDir, setOutputDir] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<SiteGenerationReport | null>(null);

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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
  };

  return (
    <div className="window-container">
      {/* Title Bar */}
      <div className="titlebar">
        <div className="titlebar-title">
          <span>mdForge - Markdown Site Generator</span>
        </div>
        <div className="titlebar-controls">
          <button className="titlebar-btn" title="Minimize">_</button>
          <button className="titlebar-btn" title="Maximize">□</button>
          <button className="titlebar-btn close" title="Close">×</button>
        </div>
      </div>

      {/* Menu Bar */}
      <div className="menubar">
        <button className="menu-item" onClick={handleNewFile}>
          <span>F</span>ile
        </button>
        <button className="menu-item">
          <span>E</span>dit
        </button>
        <button className="menu-item">
          <span>V</span>iew
        </button>
        <button className="menu-item">
          <span>T</span>ools
        </button>
        <button className="menu-item">
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
          </div>
        </div>

        {/* Right Panel - Editor & Preview */}
        <div className="panel panel-right">
          <div className="panel-header">
            Markdown Editor & Live Preview
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

            {/* Preview */}
            <div className="flex-col-1">
              <label className="form-label"> Live Preview:</label>
              <div
                className="preview-container"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
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
    </div>
  );
}

export default App;
