mod error;
mod file_manager;
mod markdown_processor;
mod site_generator;

use error::Result;
use file_manager::FileManager;
use markdown_processor::{MarkdownConfig, MarkdownProcessor};
use site_generator::{SiteConfig, SiteGenerator, SiteGenerationReport};
use std::path::PathBuf;

#[tauri::command]
async fn generate_site(
    input_dir: String,
    output_dir: String,
    template_dir: String,
    base_template: String,
) -> Result<SiteGenerationReport> {
    let config = SiteConfig {
        input_dir: PathBuf::from(input_dir),
        output_dir: PathBuf::from(output_dir),
        template_dir: PathBuf::from(template_dir),
        base_template,
    };

    let generator = SiteGenerator::new(config);
    generator.generate_site()
}

#[tauri::command]
async fn generate_site_simple(
    input_dir: String,
    output_dir: String,
) -> Result<SiteGenerationReport> {
    let config = SiteConfig {
        input_dir: PathBuf::from(input_dir),
        output_dir: PathBuf::from(output_dir),
        template_dir: PathBuf::from("./templates"),
        base_template: "base.html".to_string(),
    };

    let generator = SiteGenerator::new(config);
    generator.generate_site()
}

#[tauri::command]
async fn render_live_preview(
    markdown_content: String,
    config: Option<MarkdownConfig>,
) -> Result<String> {
    let processor = if let Some(cfg) = config {
        MarkdownProcessor::new(cfg)
    } else {
        MarkdownProcessor::default()
    };

    processor.to_html(&markdown_content)
}

#[tauri::command]
async fn render_markdown_simple(markdown_content: String) -> Result<String> {
    let processor = MarkdownProcessor::default();
    processor.to_html(&markdown_content)
}

#[tauri::command]
async fn save_file(path: String, content: String) -> Result<()> {
    FileManager::save_file(&PathBuf::from(path), &content)
}

#[tauri::command]
async fn load_file(path: String) -> Result<String> {
    FileManager::load_file(&PathBuf::from(path))
}

#[tauri::command]
async fn create_file(path: String, content: String) -> Result<()> {
    FileManager::create_file(&PathBuf::from(path), &content)
}

#[tauri::command]
async fn delete_file(path: String) -> Result<()> {
    FileManager::delete_file(&PathBuf::from(path))
}

#[tauri::command]
async fn list_markdown_files(directory: String, recursive: bool) -> Result<Vec<String>> {
    let files = FileManager::list_all_files_recursive(&PathBuf::from(directory), recursive)?;
    
    let markdown_files: Vec<String> = files
        .into_iter()
        .filter(|path| FileManager::is_markdown_file(path))
        .map(|path| path.to_string_lossy().to_string())
        .collect();
    
    Ok(markdown_files)
}

#[tauri::command]
async fn is_markdown_file(path: String) -> Result<bool> {
    Ok(FileManager::is_markdown_file(&PathBuf::from(path)))
}

#[tauri::command]
async fn create_directory(path: String) -> Result<()> {
    FileManager::create_directory(&PathBuf::from(path))
}

#[tauri::command]
async fn validate_markdown(content: String) -> Vec<markdown_processor::ValidationIssue> {
    let processor = MarkdownProcessor::default();
    processor.validate(&content)
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            generate_site,
            generate_site_simple,
            render_live_preview,
            render_markdown_simple,
            save_file,
            load_file,
            create_file,
            delete_file,
            list_markdown_files,
            is_markdown_file,
            create_directory,
            validate_markdown,
            greet,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
