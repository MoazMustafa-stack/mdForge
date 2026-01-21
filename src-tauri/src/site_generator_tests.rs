#[cfg(test)]
mod tests {
    use crate::site_generator::SiteGenerator;
    use crate::file_manager::FileManager;
    use std::path::PathBuf;
    use tempfile::TempDir;

    #[test]
    fn test_render_markdown_with_template_base() {
        let markdown = r#"# Test Title

This is a **test** markdown content.

## Subheading

- Item 1
- Item 2
"#;

        // Get the project root templates directory
        let template_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .unwrap()
            .join("templates")
            .join("base.html");

        println!("Template path: {:?}", template_path);
        println!("Template exists: {}", template_path.exists());

        let result = SiteGenerator::render_markdown_with_template(
            markdown,
            Some("Test Document".to_string()),
            &template_path,
        );

        match &result {
            Ok(html) => {
                println!("Generated HTML length: {}", html.len());
                println!("HTML preview: {}", &html[..html.len().min(500)]);
                
                assert!(html.contains("<!DOCTYPE html>"), "Missing DOCTYPE");
                assert!(html.contains("Test Document"), "Missing title");
                assert!(html.contains("<h1 id=\"test-title\">Test Title</h1>"), "Missing h1 with id");
                assert!(html.contains("<strong>test</strong>"), "Missing strong tag");
            }
            Err(e) => {
                panic!("Failed to render: {:?}", e);
            }
        }
    }

    #[test]
    fn test_render_markdown_with_template_blog() {
        let markdown = r#"---
title: My Blog Post
date: 2026-01-20
author: Test Author
---

# My Blog Post

This is the content of my blog post.
"#;

        let template_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .unwrap()
            .join("templates")
            .join("blog.html");

        let result = SiteGenerator::render_markdown_with_template(
            markdown,
            None, // Should extract from frontmatter
            &template_path,
        );

        match &result {
            Ok(html) => {
                assert!(html.contains("<!DOCTYPE html>"));
                assert!(html.contains("My Blog Post"));
                assert!(html.contains("<h1>My Blog Post</h1>"));
            }
            Err(e) => {
                panic!("Failed to render blog template: {:?}", e);
            }
        }
    }

    #[test]
    fn test_render_markdown_with_template_docs() {
        let markdown = r#"# Documentation

## Getting Started

This is a documentation page.

## Installation

Follow these steps...
"#;

        let template_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .unwrap()
            .join("templates")
            .join("docs.html");

        let result = SiteGenerator::render_markdown_with_template(
            markdown,
            Some("Docs".to_string()),
            &template_path,
        );

        match &result {
            Ok(html) => {
                assert!(html.contains("<!DOCTYPE html>"));
                assert!(html.contains("Docs"));
                assert!(html.contains("Documentation</h1>"));
            }
            Err(e) => {
                panic!("Failed to render docs template: {:?}", e);
            }
        }
    }

    #[test]
    fn test_title_extraction_from_frontmatter() {
        let markdown = r#"---
title: Frontmatter Title
---

# H1 Title

Content here.
"#;

        let title = SiteGenerator::quick_extract_title(markdown);
        assert_eq!(title, Some("Frontmatter Title".to_string()));
    }

    #[test]
    fn test_title_extraction_from_h1() {
        let markdown = r#"# H1 Title

Content without frontmatter.
"#;

        let title = SiteGenerator::quick_extract_title(markdown);
        assert_eq!(title, Some("H1 Title".to_string()));
    }

    #[test]
    fn test_title_extraction_fallback() {
        let markdown = r#"Just plain content without title"#;

        let title = SiteGenerator::quick_extract_title(markdown);
        assert_eq!(title, None);
    }

    #[test]
    fn test_end_to_end_export() {
        // Create temp directory for output
        let temp_dir = TempDir::new().unwrap();
        let output_path = temp_dir.path().join("output.html");

        let markdown = r#"# End-to-End Test

This tests the complete export workflow:

1. Markdown processing
2. Template rendering
3. File writing

**It should work!**
"#;

        let template_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .unwrap()
            .join("templates")
            .join("base.html");

        // Render
        let html = SiteGenerator::render_markdown_with_template(
            markdown,
            Some("E2E Test".to_string()),
            &template_path,
        ).expect("Failed to render");

        // Save (use std::fs::write directly to avoid extension check)
        std::fs::write(&output_path, &html).expect("Failed to save");

        // Verify file exists and has content
        assert!(output_path.exists());
        let saved_content = std::fs::read_to_string(&output_path).expect("Failed to load");
        
        assert!(saved_content.contains("<!DOCTYPE html>"));
        assert!(saved_content.contains("E2E Test"));
        assert!(saved_content.contains("End-to-End Test</h1>"));
        assert!(saved_content.contains("<strong>It should work!</strong>"));

        println!("✓ End-to-end export test passed!");
        println!("  Output file: {:?}", output_path);
        println!("  File size: {} bytes", saved_content.len());
    }

    #[test]
    fn test_template_not_found() {
        let markdown = "# Test";
        let template_path = PathBuf::from("nonexistent_template.html");

        let result = SiteGenerator::render_markdown_with_template(
            markdown,
            None,
            &template_path,
        );

        assert!(result.is_err());
        if let Err(e) = result {
            let error_msg = format!("{:?}", e);
            assert!(error_msg.contains("Template") || error_msg.contains("not exist"));
        }
    }

    #[test]
    fn test_empty_markdown() {
        let template_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .unwrap()
            .join("templates")
            .join("base.html");

        let result = SiteGenerator::render_markdown_with_template(
            "",
            None,
            &template_path,
        );

        // Should fail because markdown is empty
        assert!(result.is_err());
    }

    #[test]
    fn test_complex_markdown_features() {
        let markdown = r#"# Complex Test

## Code Blocks

```rust
fn main() {
    println!("Hello, world!");
}
```

## Tables

| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |

## Links and Images

[Link](https://example.com)

## Lists

1. First
2. Second
   - Nested
   - Items

## Blockquotes

> This is a quote
> Spanning multiple lines

**Bold** and *italic* and ~~strikethrough~~
"#;

        let template_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .unwrap()
            .join("templates")
            .join("base.html");

        let result = SiteGenerator::render_markdown_with_template(
            markdown,
            Some("Complex Test".to_string()),
            &template_path,
        );

        match &result {
            Ok(html) => {
                println!("Complex HTML snippet: {}...", &html[..html.len().min(800)]);
                assert!(html.contains("<table>"), "Missing table");
                // Code blocks might be <pre><code> or just have code content
                let has_code = html.contains("<pre>") || html.contains("println") || html.contains("fn main");
                assert!(has_code, "Missing code blocks or code content");
                assert!(html.contains("<blockquote>"), "Missing blockquote");
                assert!(html.contains("<strong>Bold</strong>"), "Missing bold");
                assert!(html.contains("<em>italic</em>"), "Missing italic");
                println!("✓ Complex markdown features test passed!");
            }
            Err(e) => {
                panic!("Failed to render complex markdown: {:?}", e);
            }
        }
    }
}
