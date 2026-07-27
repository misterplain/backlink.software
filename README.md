# backlink.software - Domain-Scoped Copy Backlink Injector

A lightweight static tool that generates an obfuscated JavaScript snippet.

The generated snippet only injects attribution on a whitelisted domain (and its subdomains), and the attribution URL is always derived from the visitor's current page at copy time.

## Core Behavior

1. You enter a URL such as `carfax.com`.
2. The generator normalizes and stores the whitelist root host (`carfax.com`).
3. The snippet listens for `copy` events.
4. On each copy, it checks `window.location.hostname` against the whitelist.
5. If host matches, it appends ` Source: <current-page-url>`.
6. If host does not match, it does nothing (no `Source:` is appended).

## Example

Whitelisted input:

- `carfax.com`

Behavior:

- On `https://carfax.com/`, copied text includes ` Source: https://carfax.com/`
- On `https://carfax.com/cars`, copied text includes ` Source: https://carfax.com/cars`
- On `cardeals.com`, copied text does not include `Source:`

## Notes on URL Format

- The source value is dynamic and uses `document.location.href` at copy time.

## Features

- URL validation with automatic `https://` prepend for bare domains
- Domain whitelist enforcement (root host + subdomains)
- Dynamic source attribution per copied page
- Obfuscated output (identifier mangling + Base64 string encoding)
- Peek view for unobfuscated snippet
- Built-in test lab

## Project Files

- `index.html` - UI markup
- `styles.css` - visual styles
- `obfuscation.js` - generator, whitelist logic, obfuscation pipeline
- `README.md` - usage and behavior docs

## Local Usage

Open directly:

```bash
open index.html
```

Or serve as static content:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Test Lab Behavior

The test lab runs inside the current host where the tool is opened.

- If your current host is in the whitelist, paste results should include `Source:`.
- If your current host is not in the whitelist, no `Source:` is expected.

## License

MIT
