# Toolroom

A local-first, modular utility dashboard built with React, TypeScript, and Vite.

## Run it

```bash
npm install
npm run dev
```

Create a production build with `npm run build`.

## Run with Docker Compose

Build and start the production container:

```bash
docker compose up -d --build
```

The app listens on container port `8080` without publishing a host port.
Networking outside this Compose project can be managed separately.

Stop and remove the app container with `docker compose down`.

## Add, edit, or remove a tool

Each tool is isolated in `src/tools/<tool-name>`. The shell only knows about the
metadata in `src/tools/registry.ts`.

### Use the project skill

This repository includes the project-scoped `$add-toolroom-tool` skill. Ask
Codex to use it when creating or substantially changing a utility:

```text
Use $add-toolroom-tool to add a JSON formatter with copy and download actions.
```

The skill follows Toolroom's component, registry, visual, accessibility, and
local-first conventions, then verifies the production build.

For a manual head start, its scaffold script creates an isolated component and
stylesheet and registers the tool in one command:

```bash
python3 .agents/skills/add-toolroom-tool/scripts/scaffold_tool.py json-formatter \
  --name "JSON Formatter" \
  --description "Format, validate, and copy JSON without uploading it." \
  --category Developer \
  --icon layers \
  --accent "#B8E3FF"
```

Run the command from the repository root. It refuses to overwrite an existing
tool or duplicate a registry entry.

### Add one by hand

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
