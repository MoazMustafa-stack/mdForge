use crate::error::{Result, MdForgeError};
use std::path::{Path, PathBuf};  
use std::fs;

// Handle all I/O ops.
pub struct FileManager;

impl FileManager{
    pub fn load_file(path: &Path) -> Result<String>{
        if !path.exists(){
            return Err(MdForgeError::not_found(path.display().to_string()));
        }

        if !Self::is_markdown_file(path){
            return Err(MdForgeError::invalid_path(
                "File must have .md or .markdown extension"
            ));
        }

        fs::read_to_string(path)
        .map_err(|e| MdForgeError::io(format!("Failed to read {}: {}",path.display(), e)))
    }

    pub fn save_file(path: &Path, content: &str) -> Result<()>{
        if let Some(parent) = path.parent(){
            if !parent.exists(){
                return Err(MdForgeError::invalid_path(
                    format!("Parent directory does nt exist: {}",parent.display())
                ))
            }
        }

        fs::write(path, content)
        .map_err(|e| MdForgeError::io(format!("Failed to write {}: {}", path.display(),e)))
    }

    pub fn create_file(path: &Path, initial_content: &str) -> Result<()>{
        if path.exists(){
            return Err(MdForgeError::io(
                format!("File already exists: {}", path.display())
            ));
        }

        Self::save_file(path, initial_content)
    }

    pub fn delete_file(path: &Path) -> Result<()>{
        if !path.exists(){
            return Err(MdForgeError::not_found(path.display().to_string()));
        }

        if path.is_dir(){
            return Err(MdForgeError::invalid_path(
                format!("Path is a directory, not a file: {}", path.display())
            ));
        }

        fs::remove_file(path)
        .map_err(|e| MdForgeError::io(format!(
            "Failed to delete {}: {}", path.display(), e)))
    }

    pub fn copy_static_asset(source: &Path, destination: &Path) -> Result<()>{
        if !source.exists(){
            return Err(MdForgeError::not_found(source.display().to_string()));
        }

        if source.is_dir(){
            return Err(MdForgeError::invalid_path(
                format!("Path is a directory, not a file: {}", source.display())
            ));
        }

        if let Some(parent) = destination.parent(){
            if !parent.exists(){
                fs::create_dir_all(parent)
                .map_err(|e| MdForgeError::io(format!(
                    "Failed to create directory {}: {}",parent.display(), e)))?;
            }
        }

        fs::copy(source, destination)
        .map_err(|e| MdForgeError::io(format!(
            "Failed to copy {} to {}: {}", source.display(), destination.display(), e
        )))?;

        Ok(())
    }

    pub fn list_markdown_files(directory: &Path) -> Result<Vec<PathBuf>>{
        if !directory.exists(){
            return Err(MdForgeError::not_found(directory.display().to_string()));
        }

        if !directory.is_dir(){
            return Err(MdForgeError::invalid_path(
                format!("Path is not a directory: {}", directory.display())
            ));
        }

        let entries = fs::read_dir(directory)
        .map_err(|e| MdForgeError::io(
            format!("Failed to read directory: {}", e)
        ))?;

        let mut md_files = Vec::new();

        for entry in entries{
            let entry = entry.map_err(
                |e| MdForgeError::io(
                    format!("Failed to read directory entry: {}",e)
                )
            )?;

            let path = entry.path();

            if path.is_file() && Self::is_markdown_file(&path){
                md_files.push(path);
            }
        }

        Ok(md_files)
    }

    pub fn file_exists(path: &Path) -> Result<bool>{
        Ok(path.exists() && path.is_file() && Self::is_markdown_file(path))
    }

    // Output folders and more
    pub fn create_directory(path: &Path) -> Result<()>{
        if path.exists() && path.is_dir(){
            return Ok(());
        }

        if path.exists() && path.is_file(){
            return Err(MdForgeError::invalid_path(
                format!("Path exists but is a file: {}", path.display())
            ));
        }

        fs::create_dir(path)
        .map_err(|e| MdForgeError::io(
            format!("Failed to create directory {}: {}", path.display(),e)
        ))
    }

    pub fn get_file_metadata(path: &Path) -> Result<FileMetadata>{
        if !path.exists(){
            return Err(MdForgeError::not_found(path.display().to_string()));
        }

        let metadata = fs::metadata(path)
        .map_err(|e| MdForgeError::io(
            format!("Failed to get metadata for {}: {}", path.display(), e)))?;
    
            Ok(FileMetadata{
                size: metadata.len(),
                modified: metadata.modified().ok(),
                is_file: metadata.is_file(),
                is_dir: metadata.is_dir(),
            })
    }

    fn is_markdown_file(path: &Path) -> bool{
        path.extension().and_then(|ext| ext.to_str())
        .map(|ext| ext.eq_ignore_ascii_case("md") || ext.eq_ignore_ascii_case("markdown"))
        .unwrap_or(false)
    }
}

/// File metadata information
#[derive(Debug, Clone, serde::Serialize)]
pub struct FileMetadata {
    pub size: u64,
    pub modified: Option<std::time::SystemTime>,
    pub is_file: bool,
    pub is_dir: bool,
}


// ----- Unit Test Section -----
// Add this to the bottom of your file_manager.rs

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::{self, File};
    use std::io::Write;
    use tempfile::tempdir;

    // Helper to create a test file
    fn create_test_file(dir: &Path, name: &str, content: &str) -> PathBuf {
        let path = dir.join(name);
        let mut file = File::create(&path).unwrap();
        file.write_all(content.as_bytes()).unwrap();
        path
    }

    #[test]
    fn test_is_markdown_file() {
        assert!(FileManager::is_markdown_file(Path::new("test.md")));
        assert!(FileManager::is_markdown_file(Path::new("test.MD")));
        assert!(FileManager::is_markdown_file(Path::new("test.markdown")));
        assert!(FileManager::is_markdown_file(Path::new("test.MARKDOWN")));
        assert!(!FileManager::is_markdown_file(Path::new("test.txt")));
        assert!(!FileManager::is_markdown_file(Path::new("test")));
        assert!(!FileManager::is_markdown_file(Path::new("test.")));
        assert!(!FileManager::is_markdown_file(Path::new("")));
    }

    #[test]
    fn test_load_file_success() {
        let temp_dir = tempdir().unwrap();
        let file_path = create_test_file(temp_dir.path(), "test.md", "# Hello World");
        
        let result = FileManager::load_file(&file_path);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "# Hello World");
    }

    #[test]
    fn test_load_file_not_found() {
        let result = FileManager::load_file(Path::new("nonexistent.md"));
        assert!(result.is_err());
        
        match result.unwrap_err() {
            MdForgeError::NotFound(_) => {}, // Expected
            other => panic!("Expected NotFound error, got {:?}", other),
        }
    }

    #[test]
    fn test_load_file_invalid_extension() {
        let temp_dir = tempdir().unwrap();
        let file_path = create_test_file(temp_dir.path(), "test.txt", "content");
        
        let result = FileManager::load_file(&file_path);
        assert!(result.is_err());
        
        match result.unwrap_err() {
            MdForgeError::InvalidPath(_) => {}, // Expected
            other => panic!("Expected InvalidPath error, got {:?}", other),
        }
    }

    #[test]
    fn test_save_file_success() {
        let temp_dir = tempdir().unwrap();
        let file_path = temp_dir.path().join("test.md");
        let content = "# Saved Content";
        
        let result = FileManager::save_file(&file_path, content);
        assert!(result.is_ok());
        
        // Verify the file was actually created with correct content
        let saved_content = fs::read_to_string(&file_path).unwrap();
        assert_eq!(saved_content, content);
    }

    #[test]
    fn test_save_file_parent_directory_missing() {
        let temp_dir = tempdir().unwrap();
        let file_path = temp_dir.path().join("nonexistent").join("test.md");
        
        let result = FileManager::save_file(&file_path, "content");
        assert!(result.is_err());
        
        match result.unwrap_err() {
            MdForgeError::InvalidPath(_) => {}, // Expected
            other => panic!("Expected InvalidPath error, got {:?}", other),
        }
    }

    #[test]
    fn test_create_file_success() {
        let temp_dir = tempdir().unwrap();
        let file_path = temp_dir.path().join("new_file.md");
        let initial_content = "# New File";
        
        let result = FileManager::create_file(&file_path, initial_content);
        assert!(result.is_ok());
        
        // Verify file exists with correct content
        let content = fs::read_to_string(&file_path).unwrap();
        assert_eq!(content, initial_content);
    }

    #[test]
    fn test_create_file_already_exists() {
        let temp_dir = tempdir().unwrap();
        let file_path = create_test_file(temp_dir.path(), "existing.md", "existing content");
        
        let result = FileManager::create_file(&file_path, "new content");
        assert!(result.is_err());
        
        match result.unwrap_err() {
            MdForgeError::Io(_) => {}, // Expected
            other => panic!("Expected Io error, got {:?}", other),
        }
    }

    #[test]
    fn test_delete_file_success() {
        let temp_dir = tempdir().unwrap();
        let file_path = create_test_file(temp_dir.path(), "to_delete.md", "content");
        
        // Verify file exists before deletion
        assert!(file_path.exists());
        
        let result = FileManager::delete_file(&file_path);
        assert!(result.is_ok());
        
        // Verify file no longer exists
        assert!(!file_path.exists());
    }

    #[test]
    fn test_delete_file_not_found() {
        let result = FileManager::delete_file(Path::new("nonexistent.md"));
        assert!(result.is_err());
        
        match result.unwrap_err() {
            MdForgeError::NotFound(_) => {}, // Expected
            other => panic!("Expected NotFound error, got {:?}", other),
        }
    }

    #[test]
    fn test_delete_directory_instead_of_file() {
        let temp_dir = tempdir().unwrap();
        
        let result = FileManager::delete_file(temp_dir.path());
        assert!(result.is_err());
        
        match result.unwrap_err() {
            MdForgeError::InvalidPath(_) => {}, // Expected
            other => panic!("Expected InvalidPath error, got {:?}", other),
        }
    }

    #[test]
    fn test_copy_static_asset_success() {
        let temp_dir = tempdir().unwrap();
        let source_path = create_test_file(temp_dir.path(), "source.css", "body { color: red; }");
        let dest_path = temp_dir.path().join("subdir").join("dest.css");
        
        let result = FileManager::copy_static_asset(&source_path, &dest_path);
        assert!(result.is_ok());
        
        // Verify both files have same content
        let source_content = fs::read_to_string(&source_path).unwrap();
        let dest_content = fs::read_to_string(&dest_path).unwrap();
        assert_eq!(source_content, dest_content);
    }

    #[test]
    fn test_list_markdown_files_success() {
        let temp_dir = tempdir().unwrap();
        create_test_file(temp_dir.path(), "file1.md", "#1");
        create_test_file(temp_dir.path(), "file2.md", "#2");
        create_test_file(temp_dir.path(), "ignore.txt", "ignore me");
        
        let result = FileManager::list_markdown_files(temp_dir.path());
        assert!(result.is_ok());
        
        let files = result.unwrap();
        assert_eq!(files.len(), 2);
        assert!(files.iter().any(|p| p.ends_with("file1.md")));
        assert!(files.iter().any(|p| p.ends_with("file2.md")));
        assert!(!files.iter().any(|p| p.ends_with("ignore.txt")));
    }

    #[test]
    fn test_list_markdown_files_nonexistent_directory() {
        let result = FileManager::list_markdown_files(Path::new("nonexistent_dir"));
        assert!(result.is_err());
        
        match result.unwrap_err() {
            MdForgeError::NotFound(_) => {}, // Expected
            other => panic!("Expected NotFound error, got {:?}", other),
        }
    }

    #[test]
    fn test_list_markdown_files_not_a_directory() {
        let temp_dir = tempdir().unwrap();
        let file_path = create_test_file(temp_dir.path(), "not_a_dir.md", "content");
        
        let result = FileManager::list_markdown_files(&file_path);
        assert!(result.is_err());
        
        match result.unwrap_err() {
            MdForgeError::InvalidPath(_) => {}, // Expected
            other => panic!("Expected InvalidPath error, got {:?}", other),
        }
    }

    #[test]
    fn test_file_exists() {
        let temp_dir = tempdir().unwrap();
        let md_file = create_test_file(temp_dir.path(), "exists.md", "content");
        let txt_file = create_test_file(temp_dir.path(), "exists.txt", "content");
        let nonexistent = temp_dir.path().join("nonexistent.md");
        
        assert!(FileManager::file_exists(&md_file).unwrap());
        assert!(!FileManager::file_exists(&txt_file).unwrap());
        assert!(!FileManager::file_exists(&nonexistent).unwrap());
    }

    #[test]
    fn test_create_directory_success() {
        let temp_dir = tempdir().unwrap();
        let new_dir = temp_dir.path().join("new_subdir");
        
        let result = FileManager::create_directory(&new_dir);
        assert!(result.is_ok());
        assert!(new_dir.exists());
        assert!(new_dir.is_dir());
    }

    #[test]
    fn test_create_directory_already_exists() {
        let temp_dir = tempdir().unwrap();
        
        let result = FileManager::create_directory(temp_dir.path());
        assert!(result.is_ok()); // Should succeed for existing directory
    }

    #[test]
    fn test_create_directory_path_is_file() {
        let temp_dir = tempdir().unwrap();
        let file_path = create_test_file(temp_dir.path(), "a_file.md", "content");
        
        let result = FileManager::create_directory(&file_path);
        assert!(result.is_err());
        
        match result.unwrap_err() {
            MdForgeError::InvalidPath(_) => {}, // Expected
            other => panic!("Expected InvalidPath error, got {:?}", other),
        }
    }

    #[test]
    fn test_get_file_metadata_success() {
        let temp_dir = tempdir().unwrap();
        let file_path = create_test_file(temp_dir.path(), "test.md", "content");
        
        let result = FileManager::get_file_metadata(&file_path);
        assert!(result.is_ok());
        
        let metadata = result.unwrap();
        assert!(metadata.size > 0);
        assert!(metadata.is_file);
        assert!(!metadata.is_dir);
        assert!(metadata.modified.is_some());
    }

    #[test]
    fn test_get_file_metadata_not_found() {
        let result = FileManager::get_file_metadata(Path::new("nonexistent.md"));
        assert!(result.is_err());
        
        match result.unwrap_err() {
            MdForgeError::NotFound(_) => {}, // Expected
            other => panic!("Expected NotFound error, got {:?}", other),
        }
    }

    #[test]
    fn test_get_file_metadata_directory() {
        let temp_dir = tempdir().unwrap();
        
        let result = FileManager::get_file_metadata(temp_dir.path());
        assert!(result.is_ok());
        
        let metadata = result.unwrap();
        assert!(metadata.is_dir);
        assert!(!metadata.is_file);
    }
}