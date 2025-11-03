use crate::error::{Result,MdForgeError};
use crate::file_manager::FileManager;
use crate::markdown_processor::{self, MarkdownConfig, MarkdownProcessor};
use serde::{Deserialize, Serialize};
use serde_json::map::Entry;
use tauri::utils::config;
use std::path::{Path, PathBuf};
use std::collections::HashMap;
use std::process::Output;

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
        
        // TO-DO: Implement Tera templating
        let final_html = self.apply_basic_template(&context); //Basic template for now

        FileManager::save_file(&output_path, &html_content)?;
        
        Ok(())
    }

    fn copy_static_asset(&self, input_path: &Path) -> Result<()>{
        let output_path = self.generate_output_path(input_path, "")?;
        FileManager::copy_static_asset(input_path, output_path)
    }

    fn generate_output_path(&self, input_path: &Path, new_extension: &str) -> Result<PathBuf>{
        
    }

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
