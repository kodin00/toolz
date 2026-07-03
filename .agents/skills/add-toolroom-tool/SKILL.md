---
name: add-toolroom-tool
description: Create, integrate, or substantially revise utilities in the Toolroom React app while preserving its modular registry, local-first privacy model, visual language, responsive behavior, and accessibility. Use when adding a tool under src/tools, registering tool metadata, extending the shared icon set for a tool, or adapting an existing utility to fit Toolroom automatically.
---

# Add Toolroom Tool

Build the complete utility, not only a component stub. Keep its implementation
isolated while using the registry and shared shell as the integration boundary.

## Workflow

1. Read `references/toolroom-contract.md`.
2. Inspect the current source of truth:
   - `src/tools/types.ts`
   - `src/tools/registry.ts`
   - `src/components/Icon.tsx`
   - `src/styles.css`
   - one comparable tool under `src/tools/`
   - `package.json`
3. Clarify the utility's input, transformations, outputs, failure states, and
   whether all processing can stay in the browser. Make local processing the
   default. Do not add uploads, analytics, remote storage, or secrets while the
   shell promises that files stay on-device.
4. Scaffold a new module from the repository root:

   ```bash
   python3 .agents/skills/add-toolroom-tool/scripts/scaffold_tool.py <tool-id> \
     --name "<Display name>" \
     --description "<One concise outcome sentence>" \
     --category <Image|Text|Developer|Files> \
     --icon <existing-icon-name> \
     --accent "<hex-color>"
   ```

   Skip scaffolding when revising an existing tool. The script refuses
   overwrites and duplicate registry entries.
5. Replace the starter panel with the complete experience. Keep tool-specific
   components, helpers, types, and CSS inside `src/tools/<tool-id>/`. Import its
   CSS from the root component and prefix selectors with the tool ID.
6. Use the existing shell vocabulary (`tool-workspace`, `tool-intro`,
   `eyebrow`) and CSS variables. Let registry metadata drive the home card,
   sidebar, and breadcrumb. Add a shared icon only when none of the current
   `IconName` values communicates the action.
7. Cover the whole interaction:
   - clear empty, active, loading, success, and error states as applicable;
   - validate file type, size, and malformed input before expensive work;
   - revoke object URLs and clean up effects;
   - preserve full-resolution output unless the UI explicitly discloses limits;
   - provide useful export/copy/reset actions;
   - use semantic controls, labels, keyboard access, visible focus, and live
     status text where state changes are otherwise silent.
8. Avoid adding dependencies unless browser APIs and existing packages are
   insufficient. If a dependency is necessary, use Context7 for its current
   documentation, explain the tradeoff, and keep the dependency tool-local.
9. Verify:

   ```bash
   npm run build
   ```

   Then exercise the tool in the app at narrow and wide viewport sizes. Test
   invalid input and the primary output, not only the happy-path rendering.

## Integration rules

- Use a lowercase kebab-case ID for the folder and registry `id`.
- Export a named PascalCase root component with no required props.
- Add exactly one `ToolDefinition` entry and keep metadata user-facing.
- Choose only a declared `ToolCategory` and `IconName`.
- Keep general shell changes rare. Make them metadata-driven when a new tool
  exposes a hard-coded assumption.
- Do not put tool behavior in `App.tsx` or another tool's folder.
- Do not commit generated user output, samples with unclear licensing, secrets,
  or build artifacts.

## Completion report

State the tool ID, key files changed, whether processing remains local, and the
verification performed. Call out any dependency, remote request, intentional
input/output limit, or untested browser behavior.
