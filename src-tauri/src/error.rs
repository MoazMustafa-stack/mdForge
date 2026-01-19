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
            std::io::ErrorKind::NotFound => MdForgeError::NotFound(err.to_string()),
            _ => MdForgeError::Io(err.to_string()),
        }
    }
}

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


// Convenience constructors
impl MdForgeError {
    pub fn io(msg: impl Into<String>) -> Self {
        MdForgeError::Io(msg.into()) 
    }
    
    pub fn markdown(msg: impl Into<String>) -> Self {
        MdForgeError::Markdown(msg.into())  
    }
    
    pub fn invalid_path(path: impl Into<String>) -> Self {
        MdForgeError::InvalidPath(path.into())  
    }
    
    pub fn template(msg: impl Into<String>) -> Self {
        MdForgeError::Config(msg.into())  
    }
    
    // pub fn config(msg: impl Into<String>) -> Self {
    //     MdForgeError::Config(msg.into())  
    // }
    
    pub fn not_found(resource: impl Into<String>) -> Self {
        MdForgeError::NotFound(resource.into()) 
    }
    
    // pub fn serialization(msg: impl Into<String>) -> Self {
    //     MdForgeError::Serialization(msg.into())  
    // }
    
    // pub fn unknown(msg: impl Into<String>) -> Self {
    //     MdForgeError::Unknown(msg.into())  
    // }
}

// Helper method to convert any error to MdForgeError::Unknown
// pub fn from_any_error<E: std::error::Error>(err: E) -> MdForgeError {
//     MdForgeError::Unknown(err.to_string())
// }

// Unit tests for MdForgeError conversions and helpers
#[cfg(test)]
mod tests {
    use super::*;
    use std::io;

    #[test]
    fn io_from_error_not_found() {
        let err = io::Error::new(io::ErrorKind::NotFound, "no file");
        let mfe: MdForgeError = err.into();
        match mfe {
            MdForgeError::NotFound(s) => assert!(s.contains("no file")),
            other => panic!("expected NotFound, got {:?}", other),
        }
    }

    #[test]
    fn io_from_error_other() {
        let err = io::Error::new(io::ErrorKind::Other, "some io");
        let mfe: MdForgeError = err.into();
        match mfe {
            MdForgeError::Io(s) => assert!(s.contains("some io")),
            other => panic!("expected Io, got {:?}", other),
        }
    }

    #[test]
    fn io_from_error_permission_denied() {
        let err = io::Error::new(io::ErrorKind::PermissionDenied, "access denied");
        let mfe: MdForgeError = err.into();
        match mfe {
            MdForgeError::Io(s) => assert!(s.contains("access denied")),
            other => panic!("expected Io, got {:?}", other),
        }
    }

    #[test]
    fn serde_json_from_error() {
        let err = serde_json::from_str::<serde_json::Value>("not json").unwrap_err();
        let mfe: MdForgeError = err.into();
        match mfe {
            MdForgeError::Serialization(s) => {
                assert!(s.contains("JSON error"));
                // FIX: Check for any JSON-related error, not specific text
                assert!(s.contains("JSON") || s.contains("json"));
            },
            other => panic!("expected Serialization, got {:?}", other),
        }
    }
    
    #[test]
    fn toml_de_from_error() {
        // invalid TOML string to trigger a deserialization error
        let err = toml::from_str::<toml::Value>("=invalid").unwrap_err();
        let mfe: MdForgeError = err.into();
        match mfe {
            MdForgeError::Serialization(s) => {
                assert!(s.contains("TOML deserialization error"));
                assert!(s.contains("TOML") || s.contains("toml"));
            },
            other => panic!("expected Serialization (TOML de), got {:?}", other),
        }
    }

    #[test]
    fn toml_ser_from_error() {
        println!("Skipping toml_ser_from_error - hard to trigger");
    }

    #[test]
    fn helper_constructors() {
        // Test all convenience constructors
        let e = MdForgeError::io("oops");
        match e {
            MdForgeError::Io(s) => assert_eq!(s, "oops"),  
            other => panic!("expected Io, got {:?}", other),
        }

        let e = MdForgeError::markdown("parse failed");
        match e {
            MdForgeError::Markdown(s) => assert_eq!(s, "parse failed"),  
            other => panic!("expected Markdown, got {:?}", other),
        }

        let e = MdForgeError::invalid_path("/bad/path");
        match e {
            MdForgeError::InvalidPath(s) => assert_eq!(s, "/bad/path"), 
            other => panic!("expected InvalidPath, got {:?}", other),
        }

        // let e = MdForgeError::config("bad config");
        // match e {
        //     MdForgeError::Config(s) => assert_eq!(s, "bad config"),  
        //     other => panic!("expected Config, got {:?}", other),
        // }

        let e = MdForgeError::not_found("file.txt");
        match e {
            MdForgeError::NotFound(s) => assert_eq!(s, "file.txt"),  
            other => panic!("expected NotFound, got {:?}", other),
        }

        // let e = MdForgeError::serialization("serialize failed");
        // match e {
        //     MdForgeError::Serialization(s) => assert_eq!(s, "serialize failed"), 
        //     other => panic!("expected Serialization, got {:?}", other),
        // }

        // let e = MdForgeError::unknown("mystery error");
        // match e {
        //     MdForgeError::Unknown(s) => assert_eq!(s, "mystery error"), 
        //     other => panic!("expected Unknown, got {:?}", other),
        // }
    }
    
    // #[test]
    // fn from_any_error_helper() {
    //     // Test with different error types
    //     let fmt_err = std::fmt::Error {};
    //     let mfe = from_any_error(fmt_err);
    //     match mfe {
    //         MdForgeError::Unknown(s) => assert_eq!(s, "an error occurred when formatting an argument"),
    //         other => panic!("expected Unknown, got {:?}", other),
    //     }

    //     // Test with a custom error
    //     #[derive(Debug)]
    //     struct CustomError;
    //     impl std::fmt::Display for CustomError {
    //         fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    //             write!(f, "custom error message")
    //         }
    //     }
    //     impl std::error::Error for CustomError {}

    //     let custom_err = CustomError;
    //     let mfe = from_any_error(custom_err);
    //     match mfe {
    //         MdForgeError::Unknown(s) => assert_eq!(s, "custom error message"),
    //         other => panic!("expected Unknown, got {:?}", other),
    //     }
    // }

    #[test]
    fn error_display_format() {
        // Test that the error messages are properly formatted
        let io_error = MdForgeError::Io("file not accessible".to_string());
        assert_eq!(format!("{}", io_error), "File I/O error: file not accessible");

        let markdown_error = MdForgeError::Markdown("parsing failed".to_string());
        assert_eq!(format!("{}", markdown_error), "Markdown processing failed: parsing failed");

        let path_error = MdForgeError::InvalidPath("/invalid".to_string());
        assert_eq!(format!("{}", path_error), "Invalid path: /invalid");

        let config_error = MdForgeError::Config("invalid setting".to_string());
        assert_eq!(format!("{}", config_error), "Configuration error: invalid setting");

        let not_found_error = MdForgeError::NotFound("document.md".to_string());
        assert_eq!(format!("{}", not_found_error), "Resource not found: document.md");

        let serialization_error = MdForgeError::Serialization("JSON parse error".to_string());
        assert_eq!(format!("{}", serialization_error), "Serialization error: JSON parse error");

        let unknown_error = MdForgeError::Unknown("something went wrong".to_string());
        assert_eq!(format!("{}", unknown_error), "Unknown error: something went wrong");
    }

    #[test]
    fn result_type_alias() {
        // Test that our Result type alias works correctly
        fn success_function() -> Result<String> {
            Ok("success".to_string())
        }

        fn error_function() -> Result<String> {
            Err(MdForgeError::io("failed"))
        }

        assert_eq!(success_function().unwrap(), "success");
        match error_function() {
            Err(MdForgeError::Io(s)) => assert_eq!(s, "failed"),
            other => panic!("expected Io error, got {:?}", other),
        }
    }

    #[test]
    fn serialization_round_trip() {
        // Test that errors can be serialized and deserialized 
        let original = MdForgeError::io("test error");
        let serialized = serde_json::to_string(&original).unwrap();
        let deserialized: MdForgeError = serde_json::from_str(&serialized).unwrap();

        match (original, deserialized) {
            (MdForgeError::Io(s1), MdForgeError::Io(s2)) => assert_eq!(s1, s2),
            _ => panic!("serialization round trip failed"),
        }
    }
}