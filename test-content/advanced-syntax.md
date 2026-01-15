# Advanced Markdown Syntax

This file tests more complex Markdown features.

## Code

### Inline Code
You can use `const x = 10;` to define a variable.

### Code Blocks
```javascript
function helloWorld() {
  console.log("Hello, 90s Desktop!");
}

helloWorld();
```

```rust
fn main() {
    println!("Testing mdForge output!");
}
```

## Tables

| Feature | Support | Note |
| :--- | :---: | ---: |
| Headings | Yes | Standard |
| Tables | Yes | GFM |
| Code | Yes | Syntax highlighting |

## Horizontal Rules

---

***

___

## Task Lists

- [x] Implement loading screen
- [x] Fix directory copy bug
- [ ] Add dark mode
- [ ] Implement site-wide search

## Footnotes

Here is a simple footnote[^1].

[^1]: This is the text for the footnote.
