use pulldown_cmark::{Options, Parser, html};
use crate::error::{Result, MdForgeError};
use serde::{Serialize, Deserialize};
use scraper::{Html, Selector};
use regex::Regex;

// Config. for markdown processing options
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarkdownConfig{
    pub smart_punctuation: bool,  // Convert quotes, dashes, etc.
    pub tables: bool,             // Enable table support
    pub footnotes: bool,          // Enable footnotes
    pub strikethrough: bool,      // Enable ~~strikethrough~~
    pub task_lists: bool,         // Enable [ ] task lists
    pub heading_anchors: bool,    // Add ID anchors to headings
}

impl Default for MarkdownConfig{
    fn default() -> Self {
        Self { 
            smart_punctuation: true, 
            tables: true, 
            footnotes: true, 
            strikethrough: true, 
            task_lists: true, 
            heading_anchors: true,
        }
    }
}

/// Represents a validation issue found in markdown
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationIssue {
    pub level: IssueLevel,
    pub message: String,
    pub suggestion: String,
}

impl ValidationIssue {
    /// Create a new warning validation issue
    pub fn warning(message: &str, suggestion: &str) -> Self {
        Self {
            level: IssueLevel::Warning,
            message: message.to_string(),
            suggestion: suggestion.to_string(),
        }
    }
}

// Severity level for validation issues
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum IssueLevel {
    Warning,
    Error,
}

// Main processor for converting markdown to HTML
pub struct MarkdownProcessor{
    config: MarkdownConfig,
}

impl MarkdownProcessor{
    pub fn new(config: MarkdownConfig) -> Self{
        Self{config} 
    }

    pub fn default() -> Self{
        Self { 
            config: MarkdownConfig::default(), 
        }
    }

    pub fn to_html(&self, markdown: &str) -> Result<String> {
        if markdown.trim().is_empty() {
            return Err(MdForgeError::markdown("Markdown content is empty!"));
        }
        
        let options = self.build_options();
        let parser = Parser::new_ext(markdown, options);
    
        let mut html_output = String::new();
        html::push_html(&mut html_output, parser);
        
        if html_output.trim().is_empty() {
            return Err(MdForgeError::markdown("Generated HTML is empty!"));
        }
        
        let html_output = self.post_process_html(html_output)?;
        
        Ok(html_output)
    }

    pub fn to_plain_text(&self, markdown: &str) -> Result<String>{
        let options = self.build_options();
        let parser = Parser::new_ext(markdown, options);
    
        let mut plain_text = String::new();
    
        for event in parser {
            if let pulldown_cmark::Event::Text(text) = event {
                if !plain_text.is_empty(){
                    plain_text.push(' ');
                }
                plain_text.push_str(text.trim());
            }
        }
    
        Ok(plain_text)
    }

    pub fn validate(&self, markdown: &str) -> Vec<ValidationIssue> {
        let mut issues = Vec::new();

        // Excessive doc. size check
        if markdown.len() > 1000000 {
            issues.push(ValidationIssue::warning(
                "Document is very large",
                "Consider breaking the document into smaller pieces"
            ));
        }
        
        // Unbalanced code blocks check
        let code_block_count = markdown.matches("```").count();
        if code_block_count % 2 != 0 {
            issues.push(ValidationIssue::warning(
                "Unbalanced code blocks",
                "Check for missing code block delimiters"
            ));
        }

        issues
    }

    fn build_options(&self) -> Options{
        let mut options = Options::empty();

        if self.config.smart_punctuation {
            options.insert(Options::ENABLE_SMART_PUNCTUATION);
        }
        if self.config.tables {
            options.insert(Options::ENABLE_TABLES);
        }
        if self.config.footnotes {
            options.insert(Options::ENABLE_FOOTNOTES);
        }
        if self.config.strikethrough {
            options.insert(Options::ENABLE_STRIKETHROUGH);
        }
        if self.config.task_lists {
            options.insert(Options::ENABLE_TASKLISTS);
        }

        options
    }

    fn post_process_html(&self, html: String) -> Result<String> {
        let mut processed = html;
    
        if self.config.heading_anchors {
            processed = self.add_heading_anchors_with_parser(processed)?;
        }
    
        processed = self.prepare_code_blocks(processed);
        processed = self.process_external_links(processed)?;
    
        Ok(processed)
    }

    fn add_heading_anchors_with_parser(&self, html: String) -> Result<String> {
        let document = Html::parse_document(&html);
        
        let selector = Selector::parse("h1, h2, h3, h4, h5, h6")
            .map_err(|e| MdForgeError::markdown(format!("Failed to parse selector: {}", e)))?;
        
        let mut result = String::new();
        let mut last_pos = 0;
        
        for element in document.select(&selector) {
            let text_content = element.text().collect::<String>();
            let anchor = self.generate_anchor(&text_content);
            let element_html = element.html();
            
            if let Some(pos) = html[last_pos..].find(&element_html) {
                let actual_pos = last_pos + pos;
                result.push_str(&html[last_pos..actual_pos]);
                
                let tag_name = element.value().name();
                let mut new_heading = format!("<{}", tag_name);
                
                for (attr, value) in element.value().attrs() {
                    if attr == "id" {
                        continue; // Skip existing IDs
                    }
                    new_heading.push_str(&format!(" {}=\"{}\"", attr, value));
                }
                
                // Add anchor ID
                new_heading.push_str(&format!(" id=\"{}\"", anchor));
                new_heading.push('>');
                new_heading.push_str(&element.inner_html());
                new_heading.push_str(&format!("</{}>", tag_name));
                
                result.push_str(&new_heading);
                last_pos = actual_pos + element_html.len();
            }
        }
        
        if last_pos < html.len() {
            result.push_str(&html[last_pos..]);
        }
        
        Ok(result)
    }
    
    fn process_external_links(&self, html: String) -> Result<String> {
        let re = Regex::new(r#"<a\s+([^>]*?\s+)?href\s*=\s*["']([^"']*)["']([^>]*)>"#)
            .map_err(|e| MdForgeError::markdown(format!("Failed to create link regex: {}", e)))?;
        
        let result = re.replace_all(&html, |caps: &regex::Captures| {
            let before_attrs = caps.get(1).map(|m| m.as_str()).unwrap_or("").trim();
            let url = &caps[2];
            let after_attrs = &caps[3];
            
            if !self.is_external_link(url) {
                return format!("<a {}href=\"{}\"{}>", 
                    if before_attrs.is_empty() { "" } else { &format!("{} ", before_attrs) },
                    url, 
                    after_attrs
                );
            }
            
            let all_attrs = if before_attrs.is_empty() {
                after_attrs.to_string()
            } else {
                format!("{} {}", before_attrs, after_attrs)
            };
            
            let (target_attr, remaining_attrs) = self.extract_and_update_attr(&all_attrs, "target", "_blank");
            let (rel_attr, final_attrs) = self.extract_and_update_attr(&remaining_attrs, "rel", "noopener noreferrer");
    
            format!("<a {}href=\"{}\" {}{}>", 
                if final_attrs.is_empty() { "" } else { &format!("{} ", final_attrs) },
                url,
                target_attr,
                rel_attr
            )
        }).to_string();
        
        Ok(result)
    }
    
    fn extract_and_update_attr(&self, attrs: &str, attr_name: &str, default_value: &str) -> (String, String) {
        let attr_pattern = format!(r#"{}\s*=\s*["']([^"']*)["']"#, attr_name);
        
        let re = Regex::new(&attr_pattern).expect("Failed to create attribute regex");
        
        if let Some(caps) = re.captures(attrs) {
            let current_value = &caps[1];
            let new_attr = if attr_name == "rel" {
                // Merge rel values for security
                let new_rel = if current_value.contains("noopener") || current_value.contains("noreferrer") {
                    current_value.to_string()
                } else {
                    format!("{} {}", current_value, default_value)
                };
                format!("{}=\"{}\"", attr_name, new_rel.trim())
            } else {
                format!("{}=\"{}\"", attr_name, current_value)
            };
            
            let remaining = re.replace(attrs, "").to_string();
            (new_attr, remaining.trim().to_string())
        } else {
            (format!("{}=\"{}\"", attr_name, default_value), attrs.to_string())
        }
    }

    /// Add CSS classes to code blocks
    fn prepare_code_blocks(&self, html: String) -> String {
        html.replace("<code>", "<code class=\"inline-code\">")
            .replace("<pre>", "<pre class=\"code-block\">")
    }
    
    /// Check if URL is external
    fn is_external_link(&self, href: &str) -> bool {
        href.starts_with("http://") || 
        href.starts_with("https://") || 
        href.starts_with("//")
    }
    
    fn generate_anchor(&self, text: &str) -> String {
        text.chars()
            .map(|c| match c {
                'a'..='z' | 'A'..='Z' | '0'..='9' => c.to_ascii_lowercase(),
                ' ' | '-' | '_' => '-',
                _ => '-',
            })
            .collect::<String>()
            .trim_matches('-')
            .to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_basic_markdown_to_html() {
        let processor = MarkdownProcessor::default();
        let markdown = "# Heading\n\nParagraph with **bold** text.";
        let result = processor.to_html(markdown);
        assert!(result.is_ok());
        let html = result.unwrap();
        assert!(html.contains("<h1"));
        assert!(html.contains("<p>"));
        assert!(html.contains("<strong>"));
    }

    #[test]
    fn test_empty_markdown() {
        let processor = MarkdownProcessor::default();
        let result = processor.to_html("");
        assert!(result.is_err());
    }

    #[test]
    fn test_plain_text_extraction() {
        let processor = MarkdownProcessor::default();
        let markdown = "# Title\nSome **bold** text";
        let result = processor.to_plain_text(markdown).unwrap();
        assert_eq!(result, "Title Some bold text");
    }
    #[test]
    fn test_heading_anchors() {
        let config = MarkdownConfig {
            heading_anchors: true,
            ..Default::default()
        };
        let processor = MarkdownProcessor::new(config);
        let markdown = "# My Heading";
        let html = processor.to_html(markdown).unwrap();
        assert!(html.contains("id=\"my-heading\""));
    }

    #[test]
    fn test_external_links() {
        let processor = MarkdownProcessor::default();
        let markdown = "[External](https://example.com)";
        let html = processor.to_html(markdown).unwrap();
        assert!(html.contains("target=\"_blank\""));
        assert!(html.contains("rel=\"noopener noreferrer\""));
    }

    #[test]
    fn test_validation() {
        let processor = MarkdownProcessor::default();
        let markdown = "# Test\n```\nunclosed code";
        let issues = processor.validate(markdown);
        assert!(!issues.is_empty());
    }
}