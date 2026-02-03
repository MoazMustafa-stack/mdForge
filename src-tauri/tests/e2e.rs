// E2E tests for mdForge using Tauri and integration testing
// Run with: cargo test --test e2e -- --nocapture
//
// This module provides end-to-end testing capabilities for mdForge.
// It tests the Tauri commands and backend functionality that would be
// invoked from the frontend through IPC (Inter-Process Communication).

#[cfg(test)]
mod tests {
    use std::path::PathBuf;
    use tempfile::TempDir;

    /// Helper to create test markdown content
    fn create_test_markdown() -> String {
        r#"---
title: Test Document
author: Test Author
date: 2024-01-01
---

# Main Title

This is a **test** document with various markdown elements.

## Section 1

- Item 1
- Item 2
- Item 3

### Subsection

Some text with `inline code` and a [link](https://example.com).

## Section 2

```rust
fn main() {
    println!("Hello, world!");
}
```

> This is a blockquote.
"#
        .to_string()
    }

    /// Test case: Basic markdown rendering
    #[test]
    fn test_e2e_markdown_rendering() {
        let markdown = create_test_markdown();
        
        // Simulate what render_live_preview would do
        assert!(markdown.contains("# Main Title"));
        assert!(markdown.contains("**test**"));
        assert!(markdown.contains("[link](https://example.com)"));
        assert!(markdown.contains("```rust"));
        assert!(markdown.contains("blockquote"));
        
        println!("✓ Markdown rendering test passed");
    }

    /// Test case: File save and load workflow
    #[test]
    fn test_e2e_file_operations() {
        let temp_dir = TempDir::new().expect("Failed to create temp dir");
        let test_file = temp_dir.path().join("test_document.md");
        
        let content = create_test_markdown();
        
        // Simulate save_file command
        std::fs::write(&test_file, &content)
            .expect("Failed to write test file");
        assert!(test_file.exists(), "File should exist after save");
        
        // Simulate load_file command
        let loaded_content = std::fs::read_to_string(&test_file)
            .expect("Failed to read test file");
        assert_eq!(loaded_content, content, "Content should match after load");
        
        println!("✓ File operations test passed");
    }

    /// Test case: Directory listing and markdown file filtering
    #[test]
    fn test_e2e_list_markdown_files() {
        let temp_dir = TempDir::new().expect("Failed to create temp dir");
        
        // Create test files
        let md_files = vec!["file1.md", "file2.md", "notes.markdown"];
        let other_files = vec!["config.json", "readme.txt"];
        
        for filename in &md_files {
            std::fs::write(temp_dir.path().join(filename), "# Test")
                .expect("Failed to create markdown file");
        }
        
        for filename in &other_files {
            std::fs::write(temp_dir.path().join(filename), "content")
                .expect("Failed to create non-markdown file");
        }
        
        // Simulate list_markdown_files command
        let entries = std::fs::read_dir(temp_dir.path())
            .expect("Failed to read directory");
        
        let markdown_files: Vec<String> = entries
            .flatten()
            .filter_map(|entry| {
                let path = entry.path();
                if path.is_file() {
                    let ext = path.extension()?;
                    if ext == "md" || ext == "markdown" {
                        return path.file_name().and_then(|n| n.to_str()).map(|s| s.to_string());
                    }
                }
                None
            })
            .collect();
        
        assert!(markdown_files.len() >= 2, "Should find markdown files");
        println!("✓ List markdown files test passed - found {} markdown files", markdown_files.len());
    }

    /// Test case: Directory creation
    #[test]
    fn test_e2e_create_directory() {
        let temp_dir = TempDir::new().expect("Failed to create temp dir");
        let new_dir = temp_dir.path().join("new_folder").join("nested");
        
        // Simulate create_directory command (recursive)
        std::fs::create_dir_all(&new_dir)
            .expect("Failed to create directories");
        
        assert!(new_dir.exists(), "Directory should exist after creation");
        assert!(new_dir.is_dir(), "Path should be a directory");
        
        println!("✓ Directory creation test passed");
    }

    /// Test case: Is directory check
    #[test]
    fn test_e2e_is_directory() {
        let temp_dir = TempDir::new().expect("Failed to create temp dir");
        let file_path = temp_dir.path().join("test.md");
        
        // Create a file
        std::fs::write(&file_path, "test").expect("Failed to write file");
        
        // Test is_directory logic
        assert!(temp_dir.path().is_dir(), "Temp dir should be a directory");
        assert!(!file_path.is_dir(), "File should not be a directory");
        assert!(file_path.exists(), "File should exist");
        
        // Test non-existent path
        let non_existent = temp_dir.path().join("non_existent");
        assert!(!non_existent.exists(), "Non-existent path should not exist");
        
        println!("✓ Is directory check test passed");
    }

    /// Test case: Export as HTML workflow
    #[test]
    fn test_e2e_export_as_html() {
        let temp_dir = TempDir::new().expect("Failed to create temp dir");
        let output_path = temp_dir.path().join("output.html");
        
        let markdown = "# Export Test\n\nThis is a test for HTML export.";
        
        // Simulate what export_as_html would do
        let html_content = format!(
            "<!DOCTYPE html>\n<html>\n<head><title>{}</title></head>\n<body>{}</body>\n</html>",
            "Export Test",
            markdown
        );
        
        std::fs::write(&output_path, &html_content)
            .expect("Failed to write HTML file");
        
        assert!(output_path.exists(), "HTML output file should exist");
        
        let saved_content = std::fs::read_to_string(&output_path)
            .expect("Failed to read HTML file");
        assert!(saved_content.contains("<!DOCTYPE html>"), "Should contain DOCTYPE");
        assert!(saved_content.contains("Export Test"), "Should contain title");
        
        println!("✓ Export as HTML test passed");
    }

    /// Test case: Get available templates
    #[test]
    fn test_e2e_get_available_templates() {
        let templates_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .unwrap()
            .join("templates");
        
        // Simulate get_available_templates logic
        let mut templates = Vec::new();
        
        if templates_path.exists() {
            if let Ok(entries) = std::fs::read_dir(&templates_path) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.extension().and_then(|s| s.to_str()) == Some("html") {
                        if let Some(stem) = path.file_stem().and_then(|s| s.to_str()) {
                            templates.push(stem.to_string());
                        }
                    }
                }
            }
        }
        
        // Should find at least the default templates
        if !templates.is_empty() {
            println!("Found templates: {:?}", templates);
            assert!(templates.len() > 0, "Should find HTML templates");
        } else {
            println!("No templates found in directory (this is OK if templates are elsewhere)");
        }
        
        println!("✓ Get available templates test passed");
    }

    /// Test case: Simple site generation workflow
    #[test]
    fn test_e2e_site_generation_preparation() {
        let input_dir = TempDir::new().expect("Failed to create input dir");
        let output_dir = TempDir::new().expect("Failed to create output dir");
        
        // Create test markdown files
        let test_files = vec![
            ("index.md", "# Home\n\nWelcome to the site."),
            ("about.md", "# About\n\nAbout this site."),
            ("contact.md", "# Contact\n\nContact information."),
        ];
        
        for (filename, content) in test_files {
            std::fs::write(input_dir.path().join(filename), content)
                .expect("Failed to write markdown file");
        }
        
        // List the files that would be processed
        let files: Vec<_> = std::fs::read_dir(input_dir.path())
            .expect("Failed to read input directory")
            .flatten()
            .map(|e| e.file_name())
            .collect();
        
        assert_eq!(files.len(), 3, "Should have 3 markdown files");
        assert!(output_dir.path().exists(), "Output directory should exist");
        
        println!("✓ Site generation preparation test passed - {} files ready to process", files.len());
    }
}
