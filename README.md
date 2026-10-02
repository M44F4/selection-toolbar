# Selection Toolbar

Selection Toolbar adds a compact floating toolbar to Obsidian whenever text is selected in the Markdown editor. Use it to format Markdown, convert selected lines into blocks or lists, and extract selected text into a new note without breaking your writing flow.

## Features

- Floating toolbar that appears only when editor text is selected.
- Inline formatting for bold, italic, underline, strikethrough, highlight, inline code, wikilinks, and Markdown links.
- Block formatting for quotes, bullet lists, numbered lists, task lists, fenced code blocks, and callouts.
- Text transforms for uppercase, lowercase, and title case.
- Extract selected text into a new note and replace the selection with a wikilink.
- Keyboard-bindable commands for every toolbar action.
- Blank-line-aware formatting: paragraphs separated by blank lines are formatted independently, while soft line breaks inside a paragraph stay together.

## Usage

Select text in a Markdown note. The toolbar appears near the selection with quick actions:

- **B**: bold
- **I**: italic
- **U**: underline
- **S**: strikethrough
- **H**: highlight
- **`**: inline code
- **[[**: wikilink
- **Link**: Markdown link
- **...**: more actions

The **...** menu contains block, callout, case conversion, and extract-to-note actions.

## Commands

All actions are registered as Obsidian commands so they can be assigned keyboard shortcuts in **Settings -> Hotkeys**.

- Format selection: bold
- Format selection: italic
- Format selection: underline
- Format selection: strikethrough
- Format selection: highlight
- Format selection: inline code
- Format selection: wikilink
- Format selection: link
- Format selection: comment
- Format selection: quote block
- Format selection: bullet list
- Format selection: numbered list
- Format selection: task list
- Format selection: code block
- Format selection: note callout
- Format selection: tip callout
- Format selection: warning callout
- Format selection: uppercase
- Format selection: lowercase
- Format selection: title case
- Extract selection to note

## Settings

Open **Settings -> Selection Toolbar** and use **Show floating toolbar** to choose where the toolbar appears: **Everywhere** (default), **Desktop only**, **Mobile only**, or **Never**.

**Desktop only** is useful when the system selection menu covers the toolbar on mobile. Commands work everywhere regardless of this setting.

## Notes On Formatting

Selection Toolbar uses standard Markdown where possible.

- Underline uses HTML: `<u>selected text</u>`.
- Highlight uses Obsidian Markdown: `==selected text==`.
- Comments use Obsidian Markdown comments: `%%selected text%%`.
- Callouts use Obsidian callout syntax, such as `> [!note]`.

For selections with blank lines, inline wrappers are applied to each paragraph-like block instead of wrapping the whole selection once.

## Installation

### Community Plugin Installation

After the plugin is published to the Obsidian community plugin directory:

1. Open **Settings -> Community plugins**.
2. Select **Browse**.
3. Search for **Selection Toolbar**.
4. Select **Install**.
5. Enable the plugin.

### Manual Installation

Download the release assets and place them in your vault at:

```text
<Vault>/.obsidian/plugins/selection-toolbar/
```

Required files:

- `main.js`
- `manifest.json`
- `styles.css`

Reload Obsidian and enable **Selection Toolbar** in **Settings -> Community plugins**.

## Development

This plugin uses TypeScript, npm, and esbuild.

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

## Release Checklist

1. Update `version` in `manifest.json`.
2. Update `versions.json` with the plugin version and minimum Obsidian version.
3. Run `npm run build`.
4. Create a GitHub release with a tag that exactly matches the version, with no leading `v`.
5. Attach `manifest.json`, `main.js`, and `styles.css` as release assets.

## Privacy

Selection Toolbar works locally inside Obsidian. It does not make network requests, collect analytics, transmit vault content, or use external services.

The extract-to-note action creates Markdown files inside your vault only when you explicitly run that action.

## Compatibility

- Minimum Obsidian version: `1.1.0`
- Desktop and mobile supported

## License

This project is licensed under the 0BSD license.
