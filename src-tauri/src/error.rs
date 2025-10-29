use thiserror::Error;
use serde::{Serialize, Deserialize};

/// Main error type for the mdForge application.
#[derive(Debug, Error, Serialize, Deserialize)]
pub enum MdForgeError {
    #[error("File I/O error: {0}")]
    Io(String),

    #[error("Markdown processing failed: {0}")]
    Markdown(String),

    #[error("Invalid path: {0}")]
    InvalidPath(String),

    #[error("Configuration error: {0}")]
    Config(String),

    #[error("Resource not found: {0}")]
    NotFound(String),

    #[error("Serialization error: {0}")]
    Serialization(String),

    #[error("Unknown error: {0}")]
    Unknown(String),
}

// 
impl From<std::io::Error> for MdForgeError {
    fn from(err: std::io::Error) -> Self {
        match err.kind() {
            std::io::ErrorKind::NotFound => 
                MdForgeError::NotFound(err.to_string()),
            _ => MdForgeError::Io(err.to_string()),
        }
    }
}

// Markdown parsing errors - pulldown-cmark doesn't have a ParseError type,
// so we'll handle markdown errors manually in our markdown processing functions
// For example, if parsing fails, we'll return MdForgeError::Markdown directly

// JSON serialization errors
impl From<serde_json::Error> for MdForgeError {
    fn from(err: serde_json::Error) -> Self {
        MdForgeError::Serialization(format!("JSON error: {}", err))
    }
}

// TOML serialization errors  
impl From<toml::ser::Error> for MdForgeError {
    fn from(err: toml::ser::Error) -> Self {
        MdForgeError::Serialization(format!("TOML serialization error: {}", err))
    }
}

impl From<toml::de::Error> for MdForgeError {
    fn from(err: toml::de::Error) -> Self {
        MdForgeError::Serialization(format!("TOML deserialization error: {}", err))
    }
}

// Type alias 
pub type Result<T> = std::result::Result<T, MdForgeError>;


impl MdForgeError {
    pub fn io(msg: impl Into<String>) -> Self {
        MdForgeError::Io(msg.into())
    }
    
    pub fn markdown(msg: impl Into<String>) -> Self {
        MdForgeError::Markdown(msg.into())
    }
    
    pub fn invalid_path(path: impl Into<String>) -> Self {
        MdForgeError::InvalidPath(format!("Invalid path: {}", path.into()))
    }
    
    pub fn config(msg: impl Into<String>) -> Self {
        MdForgeError::Config(msg.into())
    }
    
    pub fn not_found(resource: impl Into<String>) -> Self {
        MdForgeError::NotFound(format!("Resource not found: {}", resource.into()))
    }
    
    pub fn serialization(msg: impl Into<String>) -> Self {
        MdForgeError::Serialization(msg.into())
    }
    
    pub fn unknown(msg: impl Into<String>) -> Self {
        MdForgeError::Unknown(msg.into())
    }
}

// Helper method to convert any error to MdForgeError::Unknown
pub fn from_any_error<E: std::error::Error>(err: E) -> MdForgeError {
    MdForgeError::Unknown(err.to_string())
}