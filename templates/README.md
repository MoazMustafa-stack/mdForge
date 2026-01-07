# mdForge Templates

This directory contains Tera templates for generating static HTML from markdown files.

## Available Templates

### 1. `base.html` (Default)
A simple, clean template with minimal styling. Good for general-purpose documentation or simple websites.

**Features:**
- Clean, readable typography
- Responsive design
- Syntax highlighting for code blocks
- Mobile-friendly

**Variables:**
- `title` - Page title (defaults to "Untitled")
- `content` - HTML content from markdown

---

### 2. `blog.html`
A blog-focused template with header, metadata section, and styled content area.

**Features:**
- Blog post header with title
- Metadata display (author, date, tags)
- Card-style content area
- Dark theme code blocks
- Footer

**Variables:**
- `title` - Blog post title
- `content` - Post content (HTML)
- `author` - Author name (optional)
- `date` - Publication date (optional)
- `tags` - Array of tags (optional)

**Example frontmatter:**
```yaml
---
title: "My Blog Post"
author: "John Doe"
date: "2026-01-07"
tags: ["rust", "static-site"]
---
```

---

### 3. `docs.html`
A documentation template with sidebar navigation.

**Features:**
- Fixed sidebar navigation
- Clean documentation layout
- Table styling
- Enhanced blockquotes
- Wide content area for code examples

**Variables:**
- `title` - Page title
- `content` - Documentation content (HTML)
- `navigation` - Array of navigation items (optional)

**Example navigation:**
```yaml
---
title: "Getting Started"
navigation:
  - title: "Introduction"
    url: "index.html"
  - title: "Installation"
    url: "install.html"
  - title: "Configuration"
    url: "config.html"
---
```

---

## Using Templates

### Default Template
Configure in your `SiteConfig`:
```rust
let config = SiteConfig {
    template_dir: PathBuf::from("./templates"),
    base_template: "base.html".to_string(),
    // ...
};
```

### Custom Templates
To use a different template, set the `base_template` field:
```rust
config.base_template = "blog.html".to_string();
```

### Template Variables
Add variables to your markdown frontmatter:
```markdown
---
title: "My Page"
author: "Jane Doe"
date: "2026-01-07"
---

# Content here
```

---

## Creating Custom Templates

### Template Syntax (Tera)
Templates use Tera syntax (similar to Jinja2):

```html
<!-- Variables -->
{{ title }}

<!-- Default values -->
{{ title | default(value="Untitled") }}

<!-- Safe HTML (unescaped) -->
{{ content | safe }}

<!-- Conditionals -->
{% if author %}
  <p>By {{ author }}</p>
{% endif %}

<!-- Loops -->
{% for tag in tags %}
  <span>{{ tag }}</span>
{% endfor %}

<!-- Filters -->
{{ tags | join(sep=", ") }}
```

### Available Variables

**Always available:**
- `title` - Page title (extracted from frontmatter, H1, or filename)
- `content` - HTML content from markdown

**Optional (from frontmatter):**
- Any custom variable you define in YAML frontmatter

### Example Custom Template
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ title }}</title>
</head>
<body>
    <header>
        <h1>{{ site_name | default(value="My Site") }}</h1>
    </header>
    <main>
        {{ content | safe }}
    </main>
    <footer>
        {% if footer_text %}
            <p>{{ footer_text }}</p>
        {% endif %}
    </footer>
</body>
</html>
```

---

## Template Fallback

If Tera templates are not found or fail to load, mdForge automatically falls back to a basic HTML template.

---

## Learn More

- [Tera Documentation](https://keats.github.io/tera/)
- [Template Filters](https://keats.github.io/tera/docs/#filters)
- [Template Functions](https://keats.github.io/tera/docs/#functions)
