import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import "./App.css";

interface SiteReport {
  markdown_files_processed: number;
  markdown_files_failed: number;
  assets_copied: number;
  assets_failed: number;
  errors: string[];
}

function App() {
  const [inputDir, setInputDir] = useState("");
  const [outputDir, setOutputDir] = useState("");
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<SiteReport | null>(null);
  const [error, setError] = useState("");

  const [previewMd, setPreviewMd] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");

  async function selectInputDir() {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Select Markdown Source Directory",
    });
    if (selected && typeof selected === "string") {
      setInputDir(selected);
    }
  }

  async function selectOutputDir() {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Select Output Directory",
    });
    if (selected && typeof selected === "string") {
      setOutputDir(selected);
    }
  }

  async function generateSite() {
    if (!inputDir || !outputDir) {
      setError("Please select both input and output directories");
      return;
    }

    setGenerating(true);
    setError("");
    setReport(null);

    try {
      const result = await invoke<SiteReport>("generate_site_simple", {
        inputDir,
        outputDir,
      });
      setReport(result);
    } catch (err) {
      setError(String(err));
    } finally {
      setGenerating(false);
    }
  }

  async function renderPreview() {
    if (!previewMd.trim()) return;
    
    try {
      const html = await invoke<string>("render_markdown_simple", {
        markdownContent: previewMd,
      });
      setPreviewHtml(html);
    } catch (err) {
      setError(String(err));
    }
  }

  return (
    <div className="container">
      <header>
        <h1>mdForge</h1>
        <p>Static Site Generator</p>
      </header>

      <div className="main-content">
        <section className="generator-section">
          <h2>Generate Site</h2>
          
          <div className="form-group">
            <label>Input Directory (Markdown Files):</label>
            <div className="input-row">
              <input 
                type="text" 
                value={inputDir} 
                readOnly 
                placeholder="No directory selected"
              />
              <button onClick={selectInputDir}>Browse</button>
            </div>
          </div>

          <div className="form-group">
            <label>Output Directory:</label>
            <div className="input-row">
              <input 
                type="text" 
                value={outputDir} 
                readOnly 
                placeholder="No directory selected"
              />
              <button onClick={selectOutputDir}>Browse</button>
            </div>
          </div>

          <button 
            className="generate-btn" 
            onClick={generateSite}
            disabled={generating || !inputDir || !outputDir}
          >
            {generating ? "Generating..." : "Generate Site"}
          </button>

          {error && (
            <div className="error">
              <strong>Error:</strong> {error}
            </div>
          )}

          {report && (
            <div className="report">
              <h3>Generation Report</h3>
              <div className="stats">
                <div className="stat success">
                  <span className="label">Markdown Files:</span>
                  <span className="value">{report.markdown_files_processed}</span>
                </div>
                <div className="stat success">
                  <span className="label">Assets Copied:</span>
                  <span className="value">{report.assets_copied}</span>
                </div>
                {report.markdown_files_failed > 0 && (
                  <div className="stat error">
                    <span className="label">Failed:</span>
                    <span className="value">{report.markdown_files_failed}</span>
                  </div>
                )}
              </div>
              {report.errors.length > 0 && (
                <div className="errors-list">
                  <strong>Errors:</strong>
                  <ul>
                    {report.errors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="preview-section">
          <h2>Live Preview</h2>
          <div className="preview-container">
            <div className="preview-editor">
              <textarea
                placeholder="# Enter Markdown here..."
                value={previewMd}
                onChange={(e) => setPreviewMd(e.target.value)}
              />
              <button onClick={renderPreview}>Render</button>
            </div>
            <div className="preview-output">
              <div dangerouslySetInnerHTML={{ __html: previewHtml || "<p>Preview will appear here...</p>" }} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
