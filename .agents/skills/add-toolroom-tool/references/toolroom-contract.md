# Toolroom contract

## Source map

| Concern | Source of truth |
| --- | --- |
| Tool metadata and categories | `src/tools/types.ts` |
| Tool discovery and component registration | `src/tools/registry.ts` |
| Shared SVG names and paths | `src/components/Icon.tsx` |
| Shell tokens, shared layout, and breakpoints | `src/styles.css` |
| Runtime shell and tool mounting | `src/App.tsx` |
| Available packages and verification command | `package.json` |

Read these files before implementation because the project may have evolved
since this reference was written.

## Module boundary

A tool owns `src/tools/<tool-id>/`. Its root component is a named export with no
required props. Helpers, workers, types, and tool-specific styles stay in the
same folder. The registry is the only required shell integration:

```ts
{
  id: 'json-formatter',
  name: 'JSON Formatter',
  description: 'Format, validate, and copy JSON without uploading it.',
  category: 'Developer',
  icon: 'layers',
  accent: '#B8E3FF',
  component: JsonFormatter,
}
```

Keep the description short enough for a card and phrase it as a user outcome.
Use `featured` only when the product decision is explicit.

## Visual fit

- Reuse the page frame classes `tool-workspace`, `tool-intro`, and `eyebrow`.
- Use existing CSS variables such as `--ink`, `--muted`, `--paper`, `--line`,
  `--lime`, and `--sidebar`.
- Match the warm paper surfaces, dark ink controls, restrained borders,
  rounded panels, serif display headings, and compact uppercase labels.
- Put tool-specific CSS beside the component and prefix its selectors with the
  tool ID to prevent collisions.
- Support the shell's narrow layouts. Avoid fixed widths that force horizontal
  scrolling; stack multi-column workspaces at the existing mobile breakpoint.
- Prefer SVG paths in the shared `Icon` component over emoji or a new icon
  dependency.

## Product and privacy fit

Toolroom promises no sign-ins and no uploads. Prefer File, Blob, Canvas,
Web Crypto, Compression Streams, Clipboard, and download APIs. If the requested
tool fundamentally needs a remote service, stop and surface the conflict before
changing code or privacy copy. Never place service credentials in browser code.

For file tools, validate early, explain limits, avoid silent quality loss, clean
up object URLs and workers, and keep the original file untouched. For text
tools, preserve user input until an explicit clear action and make copy/download
results obvious.

## Quality bar

- Make the main task discoverable without instructions.
- Label every input and icon-only action.
- Use native buttons, inputs, labels, outputs, and status semantics.
- Keep keyboard focus visible and do not rely on color alone.
- Include useful empty and error states.
- Disable actions only when their unavailable state is evident.
- Test one realistic success case, malformed/unsupported input, reset, and the
  exported or copied result.
- Run `npm run build` after every integrated change.
