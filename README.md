# Navigator 🧭

> Better navigation for long chats on ChatGPT, Claude + Gemini

![Navigator Hero Banner](assets/hero.png)

**Navigator** is a free, open-source browser extension that helps you navigate through long AI conversations effortlessly. No more endless scrolling to find that one important response—jump directly to any prompt, response, or heading.

---

## ✨ Features

![Features Overview](assets/features.png)

- **🎯 Smart Outline Panel** — View all your prompts and AI responses in a clean, collapsible sidebar
- **📑 Heading Navigation** — Jump directly to sub-headings within long AI responses
- **🔍 Instant Search** — Filter through your entire conversation with real-time search
- **⭐ Starred Messages** — Bookmark important prompts or responses for quick access
- **🎨 Theme Support** — Auto, Light, and Dark modes that adapt to your preference
- **⌨️ Keyboard Shortcuts** — Navigate with `Cmd/Ctrl + .` and arrow keys
- **🖱️ Draggable Toggle** — Position the toggle button anywhere on your screen
- **📋 Quick Copy** — Right-click any item to copy its content to clipboard

## 🚀 Demo

![Navigator Demo](assets/demo.gif)

---

## 🔧 Installation

### Chrome / Brave / Edge (Manual Install)

1. Download or clone this repository:
   ```bash
   git clone https://github.com/yourusername/navigator.git
   ```

2. Open your browser and navigate to:
   - **Chrome**: `chrome://extensions`
   - **Brave**: `brave://extensions`
   - **Edge**: `edge://extensions`

3. Enable **Developer mode** (toggle in the top right)

4. Click **Load unpacked** and select the `navigator` folder

5. Navigate to [Claude](https://claude.ai), [ChatGPT](https://chatgpt.com), or [Gemini](https://gemini.google.com) and start using Navigator!

### Firefox (Manual Install)

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`

2. Click **Load Temporary Add-on**

3. Select any file from the extension folder (e.g., `manifest.json`)

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + .` | Toggle outline panel |
| `↑` / `k` | Move focus up |
| `↓` / `j` | Move focus down |
| `Enter` | Jump to focused item |
| `←` / `→` | Switch between view modes |
| `Escape` | Close panel |

---

## 🎯 View Modes

| Mode | Description |
|------|-------------|
| **Prompts** | Show only your prompts (user messages) |
| **All** | Show prompts, responses, and headings |
| **Stars** | Show only starred/bookmarked items |

---

## 🔨 The Problem I Faced & How I Solved It

### The Challenge

While working on building complex projects with AI assistants like Claude, ChatGPT, and Gemini, I found myself constantly frustrated with one thing: **navigating long conversations was a nightmare**.

I would often work through extensive debugging sessions, code reviews, or learning exercises that generated extremely long conversation threads. When I needed to go back to reference a specific piece of code or an explanation the AI had provided earlier, I had to scroll endlessly—sometimes through hundreds of messages—just to find what I was looking for.

The built-in navigation on these platforms wasn't helping:
- **No outline view** to see all my prompts at a glance
- **No search functionality** across the conversation
- **No way to bookmark** important responses for later reference
- **No keyboard shortcuts** for quick navigation

### The Solution

I decided to build **Navigator**—a lightweight browser extension that adds a powerful navigation sidebar to AI chat interfaces.

The key breakthrough came when I realized I could:
1. **Parse the DOM** to identify conversation turns (user prompts vs. AI responses)
2. **Extract headings** from AI responses to create a hierarchical outline
3. **Implement smooth scrolling** that accounts for sticky headers
4. **Add search filtering** that works in real-time
5. **Create a provider system** that works across Claude, ChatGPT, and Gemini despite their different DOM structures

The result is a clean, unobtrusive panel that appears on the side of your screen. Click on any item to jump directly to it. Star important messages. Search through everything. Navigate with your keyboard.

What used to take minutes of frustrating scrolling now takes seconds. 🚀

---

## 🏗️ Project Structure

```
navigator/
├── manifest.json       # Extension manifest (v3)
├── content.js         # Main extension logic
├── styles.css         # UI styling
├── index.html         # Test/demo page
├── icons/             # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── assets/            # Documentation assets
    ├── hero.png
    ├── features.png
    └── demo.gif
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](contributing.md) for details on how to get started.

---

## 🙏 Acknowledgments

- Thanks to all the developers working on AI assistants
- Built with vanilla JavaScript for maximum compatibility
- Inspired by the frustration of scrolling through 100+ message conversations

---

<p align="center">
  <strong>made by swapnil</strong>
</p>
