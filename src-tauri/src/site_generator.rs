use crate::error::{Result,MdForgeError};
use crate::file_manager::FileManager;
use crate::markdown_processor::MarkdownProcessor;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SiteConfig{
    pub input_dir: PathBuf,
    pub output_dir: PathBuf,
    pub template_dir: PathBuf,
    pub base_template: String,
}

impl Default for SiteConfig{
    fn default() -> Self {
        Self{
            input_dir: PathBuf::from("./content"),
            output_dir: PathBuf::from("./output"),
            template_dir: PathBuf::from("./templates"),
            base_template: "base.html".to_string(),
        }
    }
}

pub struct SiteGenerator{
    config: SiteConfig,
    markdown_processor: MarkdownProcessor,
}

impl SiteGenerator{
    pub fn new(config: SiteConfig) -> Self{
        Self { config, markdown_processor: MarkdownProcessor::default() }
    }

    pub fn default() -> Self{
        Self { config: SiteConfig::default(), markdown_processor: MarkdownProcessor::default() }
    }

    pub fn generate_site(&self) -> Result<SiteGenerationReport>{
        let mut report = SiteGenerationReport::new();

        FileManager::create_directory(&self.config.output_dir)?;
        let entries = FileManager::list_all_files(&self.config.input_dir)?;

        for entry in entries{
            if FileManager::is_markdown_file(&entry){
                match self.process_markdown_file(&entry){
                    Ok(_) => report.markdown_files_processed += 1,
                    Err(e) =>{
                        report.errors.push(format!("Failed to process {}: {}",entry.display(), e));
                        report.markdown_files_failed +=1;
                    }
                }
            }else{
                match self.copy_static_asset(&entry){
                    Ok(_) => report.assets_copied += 1,
                    Err(e) => {
                        report.errors.push(format!("Failed to copy {}: {}",entry.display(), e));
                        report.assets_failed += 1;
                    }
                }
            }
        }

        Ok(report)
    }

    fn process_markdown_file(&self, input_path: &Path) -> Result<()>{
        let markdown_content = FileManager::load_file(input_path)?;
        let html_content = self.markdown_processor.to_html(&markdown_content)?;
        let output_path = self.generate_output_path(input_path, "html")?;

        let mut context = HashMap::new();
        
        context.insert("content".to_string(), html_content);
        context.insert("title".to_string(), self.extract_title(input_path, &markdown_content));
        
        let final_html = self.apply_basic_template(&context); 

        FileManager::save_file(&output_path, &final_html)?;
        
        Ok(())
    }

    fn copy_static_asset(&self, input_path: &Path) -> Result<()>{
        let output_path = self.generate_output_path(input_path, "")?;
        FileManager::copy_static_asset(input_path, &output_path)
    }

    fn generate_output_path(&self, input_path: &Path, new_extension: &str) -> Result<PathBuf>{
        let relative_path = input_path
            .strip_prefix(&self.config.input_dir)
            .map_err(|_| MdForgeError::invalid_path("Input file not in content directory"))?;
        
        let mut output_path = self.config.output_dir.join(relative_path);

        if !new_extension.is_empty(){
            output_path.set_extension(new_extension);
        }

        Ok(output_path)
    }

    fn extract_title(&self, input_path: &Path, markdown_content: &str) -> String {
        // Checking for YAML frontmatter
        if let Some(title) = self.extract_from_frontmatter(markdown_content) {
            return title;
        }
        // First H1 heading
        if let Some(title) = self.extract_from_h1(markdown_content) {
            return title;
        }
        // Use filename
        if let Some(title) = self.filename_to_title(input_path) {
            return title;
        }
        // Default fallback
        "Untitled".to_string()
    }

    fn extract_from_frontmatter(&self, content: &str) -> Option<String> {
        // Check if content starts with YAML frontmatter
        if !content.starts_with("---") {
            return None;
        }

        let lines: Vec<&str> = content.lines().collect();
        if lines.len() < 3 {
            return None;
        }

        // Find the closing ---
        let end_index = lines[1..].iter().position(|&line| line.trim() == "---")?;
        for line in &lines[1..=end_index] {
            let trimmed = line.trim();
            if trimmed.starts_with("title:") {
                let title = trimmed[6..].trim();
                let title = title.trim_matches(|c| c == '"' || c == '\'');
                if !title.is_empty() {
                    return Some(title.to_string());
                }
            }
        }

        None
    }

    fn extract_from_h1(&self, content: &str) -> Option<String> {
        content
            .lines()
            .find(|line| line.trim().starts_with("# "))
            .map(|line| {
                line.trim()
                    .trim_start_matches('#')
                    .trim()
                    .to_string()
            })
    }

    fn filename_to_title(&self, path: &Path) -> Option<String> {
        path.file_stem()
            .and_then(|s| s.to_str())
            .map(|filename| {
                let cleaned = if let Some(pos) = filename.find(|c: char| c.is_alphabetic()) {
                    &filename[pos..]
                } else {
                    filename
                };

                cleaned
                    .replace('-', " ")
                    .replace('_', " ")
                    .split_whitespace()
                    .map(|word| {
                        let mut chars = word.chars();
                        match chars.next() {
                            None => String::new(),
                            Some(first) => {
                                first.to_uppercase().collect::<String>() + chars.as_str()
                            }
                        }
                    })
                    .collect::<Vec<_>>()
                    .join(" ")
            })
    }

    // ========================================
    // Template Methods
    // ========================================

    fn apply_basic_template(&self, context: &HashMap<String, String>) -> String {
        // Basic HTML template - will be replaced with template engine (Tera) later
        self.render_basic_html_template(context)
    }

    fn render_basic_html_template(&self, context: &HashMap<String, String>) -> String {
        format!(
            r#"<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{}</title>
</head>
<body>
    {}
</body>
</html>"#,
            context.get("title").unwrap_or(&"Untitled".to_string()),
            context.get("content").unwrap_or(&"".to_string())
        )
    }

    // TODO add more templates:
    // fn render_blog_template(&self, context: &HashMap<String, String>) -> String { ... }
    // fn render_documentation_template(&self, context: &HashMap<String, String>) -> String { ... }
    // fn render_landing_page_template(&self, context: &HashMap<String, String>) -> String { ... }

}

#[derive(Debug, Clone, Serialize)]
pub struct SiteGenerationReport {
    pub markdown_files_processed: u32,
    pub markdown_files_failed: u32,
    pub assets_copied: u32,
    pub assets_failed: u32,
    pub errors: Vec<String>,
}

impl SiteGenerationReport {
    pub fn new() -> Self {
        Self {
            markdown_files_processed: 0,
            markdown_files_failed: 0,
            assets_copied: 0,
            assets_failed: 0,
            errors: Vec::new(),
        }
    }

    pub fn total_files_processed(&self) -> u32 {
        self.markdown_files_processed + self.assets_copied
    }

    pub fn total_files_failed(&self) -> u32 {
        self.markdown_files_failed + self.assets_failed
    }

    pub fn is_success(&self) -> bool {
        self.total_files_failed() == 0
    }
}

impl Default for SiteGenerationReport {
    fn default() -> Self {
        Self::new()
    }
}
