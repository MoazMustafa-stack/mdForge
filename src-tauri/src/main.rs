// 1. Custom error types for the application
mod error; 
// 2. Logic for loading, saving, and deleting markdown files
mod file_manager; 
// 3. Logic for converting Markdown syntax to HTML
mod markdown_processor;
// 4. Logic to manage the output directory and trigger site generation
mod site_generator;

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    mdforge_lib::run()
}
