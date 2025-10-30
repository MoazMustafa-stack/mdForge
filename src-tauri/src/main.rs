#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod error;
mod file_manager;
mod markdown_processor;
mod site_generator;

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
fn main() {
    mdforge_lib::run()
}
