# backlink.software — Copy-Event Backlink Injector

A lightweight, browser-based tool that generates an obfuscated JavaScript snippet. When the snippet is embedded in a webpage, it automatically appends a `Source:` attribution link to any text a visitor copies from that page — helping drive backlink attribution without modifying visible page content.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [Usage](#usage)
- [Embedding the Snippet](#embedding-the-snippet)
- [Testing](#testing)
- [Obfuscation Pipeline](#obfuscation-pipeline)
- [Browser Compatibility](#browser-compatibility)
- [License](#license)

---

## Overview

`backlink.software` is a zero-dependency, static web application. You paste your target URL into the generator, click **Generate**, and receive an obfuscated `<script>` snippet ready to drop into any webpage. Every time a visitor copies text from that page, the snippet silently appends a `Source: <your-url>` line to their clipboard — both in plain text and HTML formats.

---

## Features

- **One-click snippet generation** — enter a URL, get a copy-ready script tag
- **Dual clipboard format** — injects attribution into both `text/plain` and `text/html` clipboard data
- **Smart text normalisation** — collapses excess whitespace, trims lines, and deduplicates blank lines before appending the source link
- **URL validation** — accepts bare domains (`example.com`), auto-prepends `https://`, and rejects invalid or non-HTTP(S) URLs
- **Obfuscated output** — variable names are mangled and all string literals are Base64-encoded (`atob`/`btoa`) to reduce readability
- **Peek modal** — preview the human-readable version of the generated code before copying
- **Built-in test lab** — run the generated snippet in-page and verify clipboard output without leaving the tool
- **Copy output button** — copies the obfuscated snippet to clipboard via the Clipboard API (falls back to `execCommand`)
- **Pure static** — no build step, no server, no external requests

---

## Tech Stack

| Layer         | Technology                                                           |
| ------------- | -------------------------------------------------------------------- |
| Markup        | HTML5 (semantic)                                                     |
| Styling       | CSS3 — CSS custom properties, `backdrop-filter`, CSS Grid, `clamp()` |
| Logic         | Vanilla JavaScript (ES5-compatible IIFE, no frameworks or libraries) |
| Clipboard API | `navigator.clipboard.writeText` + `ClipboardEvent.clipboardData`     |
| Encoding      | `btoa` / `atob` (browser-native Base64)                              |
| Fonts         | System font stack (`Avenir Next`, `Segoe UI`)                        |
| Dependencies  | **None**                                                             |

---

## Project Structure

```
obfuscator/
├── index.html          # Application markup and entry point
├── styles.css          # All CSS — custom properties, layout, components, and media queries
├── obfuscation.js      # Generator logic, obfuscation pipeline, and event wiring
└── README.md
```

> Styles are kept in `styles.css` and linked via a `<link>` tag. All JavaScript lives in `obfuscation.js`, which is loaded as a plain `<script>` tag.

---

## How It Works

1. **Snippet construction** — the generator now builds two related snippets:
   - `buildPreviewCode(targetUrl)` returns the exact human-readable snippet shown in the Peek modal, including the `<script>` wrapper and injected `Source: <url>` value
   - `buildSourceCode(targetUrl)` returns the executable JavaScript used for the output textarea and obfuscation pipeline
   - The executable version attaches a `copy` event listener to `document`, clones the selected DOM range, normalises the plain-text content, and appends `\n\nSource: <url>`
   - It writes both `text/plain` and `text/html` data to `event.clipboardData`, then calls `event.preventDefault()`

2. **Obfuscation** — the plain snippet is passed through two transforms:
   - `simpleObfuscate` — renames all non-reserved identifiers to sequential hex tokens (`_0x1`, `_0x2`, …)
   - `encodeStrings` — replaces every quoted string literal with an `atob("…")` call

3. **Output** — the obfuscated code is displayed in a read-only `<textarea>` and can be copied to clipboard or peeked as formatted source.

---

## Usage

Because the project is a static site with no build step, you can open it directly in a browser.

### Open locally

```bash
# clone or download the repository, then:
open index.html          # macOS
start index.html         # Windows
xdg-open index.html      # Linux
```

Or serve it with any static file server:

```bash
# Python
python3 -m http.server 8080

# Node.js (npx)
npx serve .
```

Then navigate to `http://localhost:8080`.

### Generate a snippet

1. Enter your target URL in the **URL** field (e.g. `https://example.com` or just `example.com`).
2. Click **Generate**.
3. The obfuscated snippet appears in the output textarea.
4. Click **Copy output** to copy it to your clipboard.

---

## Embedding the Snippet

Paste the copied `<script>` block anywhere inside the `<body>` of your target webpage:

```html
<!-- anywhere inside <body> -->
<script>
  /* paste obfuscated snippet here */
</script>
```

No additional configuration is needed. The snippet is self-contained and initialises itself on load.

---

## Testing

The built-in **Test Lab** lets you verify the snippet without leaving the tool:

1. Generate a snippet for your URL.
2. Click **Enable test listener** — this executes the obfuscated code in the current page context.
3. Click **Select sample text** to highlight the sample paragraph.
4. Press `Cmd/Ctrl + C` to copy it.
5. Paste into the **Paste result here** box.
6. The tool checks whether the pasted text contains `Source: <your-url>` and reports success or failure.

---

## Obfuscation Pipeline

```
buildOriginalCode(url)
        │
        ▼
  simpleObfuscate()        ← renames identifiers to _0x1, _0x2, …
        │
        ▼
   encodeStrings()         ← wraps string literals in atob("base64…")
        │
        ▼
  obfuscated output
```

The obfuscation is intentionally lightweight — it is designed to obscure intent from casual inspection, not to withstand determined reverse engineering. String literals containing the target URL are encoded but the overall structure remains valid JavaScript.

---

## Browser Compatibility

The generated snippet uses only APIs available in all modern browsers:

| API                             | Requirement                         |
| ------------------------------- | ----------------------------------- |
| `document.addEventListener`     | IE9+                                |
| `ClipboardEvent.clipboardData`  | Chrome 41+, Firefox 22+, Safari 10+ |
| `window.getSelection` / `Range` | All modern browsers                 |
| `btoa` / `atob`                 | All modern browsers                 |

The generator UI itself uses `navigator.clipboard.writeText` (requires a secure context — `https://` or `localhost`), with an `execCommand('copy')` fallback for older environments.

---

## License

MIT — feel free to use, modify, and distribute.
