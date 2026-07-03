# Toolroom

A local-first, modular utility dashboard built with React, TypeScript, and Vite.

## Run it

```bash
npm install
npm run dev
```

Create a production build with `npm run build`.

## Add, edit, or remove a tool

Each tool is isolated in `src/tools/<tool-name>`. The shell only knows about the
metadata in `src/tools/registry.ts`.

1. Create a folder with the tool's component and any tool-specific helpers.
2. Import its root component in `src/tools/registry.ts`.
3. Add one `ToolDefinition` entry.

Removing that entry removes the tool from the dashboard and navigation without
changing any other module. Editing a tool stays contained in its own folder.

## Included tool

The background remover:

- accepts PNG, JPG, WEBP, and SVG images up to 25 MB;
- automatically samples the top-left background color;
- lets you remove up to eight sampled or manually chosen colors;
- supports connected-area and global color removal;
- offers color-range and edge-softness controls;
- exports the result as a transparent PNG;
- processes everything locally in the browser.
