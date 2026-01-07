use crate::error::{Result,MdForgeError};
use crate::file_manager::FileManager;
use crate::markdown_processor::MarkdownProcessor;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::collections::HashMap;

/// Configuration for site generation
#[allow(dead_code)]
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

/// Main site generator that processes markdown files and generates static HTML
#[allow(dead_code)]
pub struct SiteGenerator{
    config: SiteConfig,
    markdown_processor: MarkdownProcessor,
}

#[allow(dead_code)]
impl SiteGenerator{
    pub fn new(config: SiteConfig) -> Self{
        Self { config, markdown_processor: MarkdownProcessor::default() }
    }

    pub fn default() -> Self{
        Self { config: SiteConfig::default(), markdown_processor: MarkdownProcessor::default() }
    }

    pub fn generate_site(&self) -> Result<SiteGenerationReport>{
        self.generate_site_with_options(true)
    }

    pub fn generate_site_with_options(&self, recursive: bool) -> Result<SiteGenerationReport>{
        let mut report = SiteGenerationReport::new();

        FileManager::create_directory(&self.config.output_dir)?;
        let entries = FileManager::list_all_files_recursive(&self.config.input_dir, recursive)?;

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

        // Ensure parent directory exists
        if let Some(parent) = output_path.parent() {
            FileManager::create_directory(parent)?;
        }

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

        // Find the closing --- (position is relative to lines[1..], so add 1 for actual index)
        let end_index = lines[1..].iter().position(|&line| line.trim() == "---")?;
        let actual_end = end_index + 1;
        
        // Safety check to ensure we don't go out of bounds
        if actual_end >= lines.len() {
            return None;
        }
        
        for line in &lines[1..=actual_end] {
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
                // Remove common date prefixes (e.g., "2024-01-15-" or "20240115-")
                let cleaned = if let Some(pos) = filename.find(|c: char| c.is_alphabetic()) {
                    if pos > 0 && filename.chars().take(pos).all(|c| c.is_numeric() || c == '-' || c == '_') {
                        &filename[pos..]
                    } else {
                        filename
                    }
                } else {
                    // No alphabetic characters found, use as-is
                    filename
                };

                let title = cleaned
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
                    .join(" ");
                
                // Return original filename if title is empty after processing
                if title.is_empty() {
                    filename.to_string()
                } else {
                    title
                }
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

/// Report containing statistics and errors from site generation
#[allow(dead_code)]
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

#[cfg(test)]
mod tests {
    use super::*;

    // ========================================
    // Title Extraction Tests
    // ========================================

    #[test]
    fn test_extract_title_from_frontmatter() {
        let generator = SiteGenerator::default();
        let content = r#"---
title: "My Awesome Post"
author: John Doe
---
# Some Heading
Content here"#;
        
        let path = Path::new("test.md");
        let title = generator.extract_title(path, content);
        assert_eq!(title, "My Awesome Post");
    }

    #[test]
    fn test_extract_title_from_frontmatter_no_quotes() {
        let generator = SiteGenerator::default();
        let content = r#"---
title: Simple Title
---
Content"#;
        
        let path = Path::new("test.md");
        let title = generator.extract_title(path, content);
        assert_eq!(title, "Simple Title");
    }

    #[test]
    fn test_extract_title_from_h1() {
        let generator = SiteGenerator::default();
        let content = r#"# Welcome to My Site
This is some content"#;
        
        let path = Path::new("test.md");
        let title = generator.extract_title(path, content);
        assert_eq!(title, "Welcome to My Site");
    }

    #[test]
    fn test_extract_title_from_h1_with_extra_spaces() {
        let generator = SiteGenerator::default();
        let content = "#    Padded Title   \nContent";
        
        let path = Path::new("test.md");
        let title = generator.extract_title(path, content);
        assert_eq!(title, "Padded Title");
    }

    #[test]
    fn test_extract_title_from_filename_kebab_case() {
        let generator = SiteGenerator::default();
        let content = "Just some content without headings";
        
        let path = Path::new("my-blog-post.md");
        let title = generator.extract_title(path, content);
        assert_eq!(title, "My Blog Post");
    }

    #[test]
    fn test_extract_title_from_filename_snake_case() {
        let generator = SiteGenerator::default();
        let content = "Content without title";
        
        let path = Path::new("my_document_file.md");
        let title = generator.extract_title(path, content);
        assert_eq!(title, "My Document File");
    }

    #[test]
    fn test_extract_title_from_filename_with_date_prefix() {
        let generator = SiteGenerator::default();
        let content = "Content";
        
        let path = Path::new("2024-01-15-hello-world.md");
        let title = generator.extract_title(path, content);
        assert_eq!(title, "Hello World");
    }

    #[test]
    fn test_extract_title_fallback_to_untitled() {
        let generator = SiteGenerator::default();
        let content = "Content without title";
        
        // Path with no stem (shouldn't happen in practice, but test the fallback)
        let path = Path::new("");
        let title = generator.extract_title(path, content);
        assert_eq!(title, "Untitled");
    }

    #[test]
    fn test_extract_from_frontmatter_no_frontmatter() {
        let generator = SiteGenerator::default();
        let content = "# Just a heading\nNo frontmatter here";
        
        let result = generator.extract_from_frontmatter(content);
        assert_eq!(result, None);
    }

    #[test]
    fn test_extract_from_frontmatter_no_title_field() {
        let generator = SiteGenerator::default();
        let content = r#"---
author: John Doe
date: 2024-01-15
---
Content"#;
        
        let result = generator.extract_from_frontmatter(content);
        assert_eq!(result, None);
    }

    #[test]
    fn test_extract_from_h1_no_heading() {
        let generator = SiteGenerator::default();
        let content = "Just plain text\nNo headings here\n## This is H2, not H1";
        
        let result = generator.extract_from_h1(content);
        assert_eq!(result, None);
    }

    #[test]
    fn test_filename_to_title_simple() {
        let generator = SiteGenerator::default();
        let path = Path::new("hello-world.md");
        
        let result = generator.filename_to_title(path);
        assert_eq!(result, Some("Hello World".to_string()));
    }

    #[test]
    fn test_filename_to_title_mixed_separators() {
        let generator = SiteGenerator::default();
        let path = Path::new("my_awesome-document.md");
        
        let result = generator.filename_to_title(path);
        assert_eq!(result, Some("My Awesome Document".to_string()));
    }

    // ========================================
    // Template Tests
    // ========================================

    #[test]
    fn test_apply_basic_template() {
        let generator = SiteGenerator::default();
        let mut context = HashMap::new();
        context.insert("title".to_string(), "Test Page".to_string());
        context.insert("content".to_string(), "<h1>Hello</h1>".to_string());
        
        let html = generator.apply_basic_template(&context);
        
        assert!(html.contains("<title>Test Page</title>"));
        assert!(html.contains("<h1>Hello</h1>"));
        assert!(html.contains("<!DOCTYPE html>"));
    }

    #[test]
    fn test_apply_basic_template_missing_title() {
        let generator = SiteGenerator::default();
        let mut context = HashMap::new();
        context.insert("content".to_string(), "<p>Content</p>".to_string());
        
        let html = generator.apply_basic_template(&context);
        
        assert!(html.contains("<title>Untitled</title>"));
        assert!(html.contains("<p>Content</p>"));
    }

    #[test]
    fn test_apply_basic_template_missing_content() {
        let generator = SiteGenerator::default();
        let mut context = HashMap::new();
        context.insert("title".to_string(), "Test".to_string());
        
        let html = generator.apply_basic_template(&context);
        
        assert!(html.contains("<title>Test</title>"));
        assert!(html.contains("<body>"));
    }

    // ========================================
    // SiteGenerationReport Tests
    // ========================================

    #[test]
    fn test_site_generation_report_new() {
        let report = SiteGenerationReport::new();
        
        assert_eq!(report.markdown_files_processed, 0);
        assert_eq!(report.markdown_files_failed, 0);
        assert_eq!(report.assets_copied, 0);
        assert_eq!(report.assets_failed, 0);
        assert_eq!(report.errors.len(), 0);
    }

    #[test]
    fn test_site_generation_report_total_files_processed() {
        let mut report = SiteGenerationReport::new();
        report.markdown_files_processed = 5;
        report.assets_copied = 3;
        
        assert_eq!(report.total_files_processed(), 8);
    }

    #[test]
    fn test_site_generation_report_total_files_failed() {
        let mut report = SiteGenerationReport::new();
        report.markdown_files_failed = 2;
        report.assets_failed = 1;
        
        assert_eq!(report.total_files_failed(), 3);
    }

    #[test]
    fn test_site_generation_report_is_success() {
        let mut report = SiteGenerationReport::new();
        report.markdown_files_processed = 5;
        
        assert!(report.is_success());
        
        report.markdown_files_failed = 1;
        assert!(!report.is_success());
    }

    #[test]
    fn test_site_generation_report_default() {
        let report = SiteGenerationReport::default();
        
        assert_eq!(report.total_files_processed(), 0);
        assert_eq!(report.total_files_failed(), 0);
        assert!(report.is_success());
    }

    // ========================================
    // SiteConfig Tests
    // ========================================

    #[test]
    fn test_site_config_default() {
        let config = SiteConfig::default();
        
        assert_eq!(config.input_dir, PathBuf::from("./content"));
        assert_eq!(config.output_dir, PathBuf::from("./output"));
        assert_eq!(config.template_dir, PathBuf::from("./templates"));
        assert_eq!(config.base_template, "base.html");
    }

    #[test]
    fn test_site_generator_default() {
        let generator = SiteGenerator::default();
        
        assert_eq!(generator.config.input_dir, PathBuf::from("./content"));
        assert_eq!(generator.config.output_dir, PathBuf::from("./output"));
    }

    #[test]
    fn test_site_generator_new_with_custom_config() {
        let config = SiteConfig {
            input_dir: PathBuf::from("./my-content"),
            output_dir: PathBuf::from("./dist"),
            template_dir: PathBuf::from("./my-templates"),
            base_template: "custom.html".to_string(),
        };
        
        let generator = SiteGenerator::new(config.clone());
        
        assert_eq!(generator.config.input_dir, PathBuf::from("./my-content"));
        assert_eq!(generator.config.output_dir, PathBuf::from("./dist"));
        assert_eq!(generator.config.template_dir, PathBuf::from("./my-templates"));
        assert_eq!(generator.config.base_template, "custom.html");
    }
}
