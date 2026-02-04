# Contributing to Navigator 🤝

First off, thank you for considering contributing to Navigator! It's people like you that make this extension better for everyone navigating long AI conversations.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Project Architecture](#project-architecture)
- [Submitting Changes](#submitting-changes)
- [Style Guidelines](#style-guidelines)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

---

## 📜 Code of Conduct

By participating in this project, you agree to maintain a welcoming and respectful environment for everyone. Be kind, be patient, and be constructive in your feedback.

---

## 🛠️ How Can I Contribute?

### 🐛 Bug Fixes
- Check the [Issues](https://github.com/yourusername/navigator/issues) page for known bugs
- If you find a new bug, please open an issue first before submitting a fix
- Include steps to reproduce and expected vs actual behavior

### ✨ New Features
- For major features, open an issue first to discuss the idea
- For minor enhancements, feel free to submit a PR directly
- Make sure the feature works across all supported platforms (Claude, ChatGPT, Gemini)

### 📝 Documentation
- Improve README or other documentation
- Add code comments for complex logic
- Create tutorials or usage guides

### 🌐 New Platform Support
- Add support for additional AI chat platforms
- Follow the existing provider pattern in `content.js`

---

## 💻 Development Setup

### Prerequisites

- A Chromium-based browser (Chrome, Brave, Edge) or Firefox
- Git for version control
- A code editor (VS Code recommended)

### Getting Started

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/yourusername/navigator.git
   cd navigator
   ```

2. **Load the extension in your browser**
   
   **Chrome/Brave/Edge:**
   - Go to `chrome://extensions` (or equivalent)
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the project folder
   
   **Firefox:**
   - Go to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select `manifest.json`

3. **Test your changes**
   - Open `index.html` in your browser for local testing
   - Or navigate to Claude/ChatGPT/Gemini to test in production

4. **Reload the extension after making changes**
   - Click the refresh icon on the extensions page
   - Or use the keyboard shortcut if available

---

## 🏗️ Project Architecture

### Core Files

| File | Purpose |
|------|---------|
| `manifest.json` | Extension configuration and permissions |
| `content.js` | Main logic - DOM parsing, UI, event handling |
| `styles.css` | All UI styling with CSS custom properties |
| `index.html` | Local test environment |

### Key Concepts in `content.js`

#### Provider System
```javascript
const PROVIDERS = {
  claude: { /* ... */ },
  chatgpt: { /* ... */ },
  gemini: { /* ... */ },
  dev: { /* for local testing */ }
};
```
Each provider defines:
- `isMatch()` — Returns true if current site matches this provider
- `scrollContainerSelector` — CSS selector for the scrollable container
- `getTurns(container)` — Extracts conversation turns from the DOM

#### State Management
```javascript
const state = {
  isOpen: false,           // Panel visibility
  currentProvider: null,   // Active provider
  searchTerm: '',          // Current search query
  viewLevel: 2,            // 1=Prompts, 2=All, 3=Stars
  starredSignature: new Set(), // Bookmarked items
  themeMode: 'auto',       // auto, light, dark
  // ... drag state, navigation state, observers
};
```

#### Main Functions
- `createUI()` — Builds the sidebar DOM
- `refreshNavigation()` — Rebuilds the navigation list
- `scrollToElement()` — Smooth scroll to target element
- `updateScrollProgress()` — Updates the scroll percentage

---

## 📤 Submitting Changes

### Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the style guidelines below
   - Test on at least one supported platform
   - Update documentation if needed

3. **Commit with clear messages**
   ```bash
   git commit -m "feat: add keyboard shortcut for copying messages"
   ```
   
   Commit message prefixes:
   - `feat:` — New feature
   - `fix:` — Bug fix
   - `docs:` — Documentation only
   - `style:` — Code style (formatting, etc.)
   - `refactor:` — Code refactoring
   - `test:` — Adding tests

4. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then open a Pull Request on GitHub

5. **Respond to feedback**
   - Be open to suggestions
   - Make requested changes promptly

---

## 🎨 Style Guidelines

### JavaScript

- Use vanilla JavaScript (no frameworks)
- Use `const` by default, `let` when needed, never `var`
- Use arrow functions for callbacks
- Add comments for complex logic
- Keep functions focused and single-purpose

```javascript
// ✅ Good
const cleanText = (text) => {
  if (!text) return '...';
  return text.trim().replace(/\s+/g, ' ').substring(0, 50);
};

// ❌ Avoid
function cleanText(text) {
  var result = "";
  // ... complex logic without comments
  return result;
}
```

### CSS

- Use CSS custom properties for theming
- Prefix all classes with `navigator-` to avoid conflicts
- Keep selectors as simple as possible
- Group related styles together

```css
/* ✅ Good */
.navigator-nav-item {
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.15s;
}

.navigator-nav-item:hover {
  background: var(--hover-bg);
}
```

---

## 🐛 Reporting Bugs

When reporting bugs, please include:

1. **Browser and version** (e.g., Chrome 120)
2. **Platform** (e.g., ChatGPT, Claude, Gemini)
3. **Steps to reproduce**
4. **Expected behavior**
5. **Actual behavior**
6. **Screenshots** (if applicable)
7. **Console errors** (if any)

### Bug Report Template

```markdown
**Browser:** Chrome 120
**Platform:** ChatGPT
**Extension Version:** 1.1.0

**Steps to Reproduce:**
1. Open a long conversation
2. Click the Navigator toggle button
3. ...

**Expected:** Panel should open with navigation items
**Actual:** Panel opens but shows "No matches found"

**Console Errors:** (if any)
```

---

## 💡 Suggesting Features

Feature requests are welcome! When suggesting features:

1. **Check existing issues** to avoid duplicates
2. **Describe the problem** you're trying to solve
3. **Explain your proposed solution**
4. **Consider edge cases** and potential issues

### Feature Request Template

```markdown
**Problem:** When conversations are very long, it's hard to find...

**Proposed Solution:** Add a feature that...

**Alternatives Considered:** I also thought about...

**Additional Context:** This would be especially useful when...
```

---

## 🎉 Thank You!

Every contribution, no matter how small, makes Navigator better for the community. Whether you're fixing a typo, adding a feature, or just reporting a bug—thank you!

<p align="center">
  <strong>Happy contributing! 🚀</strong>
</p>
