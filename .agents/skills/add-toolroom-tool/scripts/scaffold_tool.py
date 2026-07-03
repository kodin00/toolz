#!/usr/bin/env python3
"""Create and register a minimal Toolroom tool without overwriting existing work."""

from __future__ import annotations

import argparse
import html
import re
import sys
from pathlib import Path


ID_PATTERN = re.compile(r"^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$")
HEX_PATTERN = re.compile(r"^#[0-9A-Fa-f]{6}$")
CATEGORIES = ("Image", "Text", "Developer", "Files")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Scaffold a self-contained Toolroom module and registry entry."
    )
    parser.add_argument("tool_id", help="Lowercase kebab-case ID, e.g. json-formatter")
    parser.add_argument("--name", required=True, help="User-facing tool name")
    parser.add_argument("--description", required=True, help="Concise card description")
    parser.add_argument("--category", required=True, choices=CATEGORIES)
    parser.add_argument("--icon", required=True, help="Existing IconName value")
    parser.add_argument("--accent", required=True, help="Six-digit hex card accent")
    parser.add_argument(
        "--project-root",
        type=Path,
        default=Path.cwd(),
        help="Toolroom repository root (defaults to current directory)",
    )
    return parser.parse_args()


def component_name(tool_id: str) -> str:
    return "".join(part.capitalize() for part in tool_id.split("-"))


def single_quoted(value: str) -> str:
    escaped = (
        value.replace("\\", "\\\\")
        .replace("'", "\\'")
        .replace("\r", "\\r")
        .replace("\n", "\\n")
    )
    return "'" + escaped + "'"


def jsx_text(value: str) -> str:
    return (
        html.escape(value, quote=False)
        .replace("{", "&#123;")
        .replace("}", "&#125;")
    )


def fail(message: str) -> None:
    print(f"error: {message}", file=sys.stderr)
    raise SystemExit(1)


def main() -> None:
    args = parse_args()
    root = args.project_root.expanduser().resolve()
    registry_path = root / "src/tools/registry.ts"
    icon_path = root / "src/components/Icon.tsx"
    tools_path = root / "src/tools"

    if not ID_PATTERN.fullmatch(args.tool_id):
        fail("tool_id must be lowercase kebab-case and start with a letter")
    if not HEX_PATTERN.fullmatch(args.accent):
        fail("--accent must be a six-digit hex color such as #B8E3FF")
    if not args.name.strip() or not args.description.strip():
        fail("--name and --description cannot be blank")
    if not registry_path.is_file() or not icon_path.is_file():
        fail(f"{root} does not look like the Toolroom repository root")

    tool_dir = tools_path / args.tool_id
    if tool_dir.exists():
        fail(f"{tool_dir.relative_to(root)} already exists")

    registry = registry_path.read_text(encoding="utf-8")
    if re.search(rf"\bid:\s*['\"]{re.escape(args.tool_id)}['\"]", registry):
        fail(f"registry already contains tool ID {args.tool_id!r}")

    icon_source = icon_path.read_text(encoding="utf-8")
    icon_names = set(re.findall(r"\|\s*'([^']+)'", icon_source))
    if args.icon not in icon_names:
        available = ", ".join(sorted(icon_names))
        fail(f"unknown icon {args.icon!r}; choose one of: {available}")

    component = component_name(args.tool_id)
    component_path = tool_dir / f"{component}.tsx"
    css_path = tool_dir / f"{component}.css"
    import_marker = "import type { ToolDefinition } from './types'"
    array_marker = "\n]\n\nexport function getTool"
    if import_marker not in registry or array_marker not in registry:
        fail("registry shape is not recognized; update it manually")

    import_line = f"import {{ {component} }} from './{args.tool_id}/{component}'\n"
    updated_registry = registry.replace(import_marker, import_line + import_marker, 1)
    entry = (
        "  {\n"
        f"    id: {single_quoted(args.tool_id)},\n"
        f"    name: {single_quoted(args.name.strip())},\n"
        f"    description: {single_quoted(args.description.strip())},\n"
        f"    category: {single_quoted(args.category)},\n"
        f"    icon: {single_quoted(args.icon)},\n"
        f"    accent: {single_quoted(args.accent.upper())},\n"
        f"    component: {component},\n"
        "  },\n"
    )
    updated_registry = updated_registry.replace(
        array_marker, f"\n{entry}]\n\nexport function getTool", 1
    )

    safe_name = jsx_text(args.name.strip())
    safe_description = jsx_text(args.description.strip())
    title_parts = safe_name.rsplit(" ", 1)
    title = (
        f"{title_parts[0]}<br /><em>{title_parts[1]}.</em>"
        if len(title_parts) == 2
        else f"<em>{title_parts[0]}.</em>"
    )
    component_source = f"""import './{component}.css'

export function {component}() {{
  return (
    <div className="tool-workspace">
      <section className="tool-intro">
        <div>
          <span className="eyebrow"><i /> {args.category.upper()} UTILITY</span>
          <h1>{title}</h1>
        </div>
        <p>{safe_description}</p>
      </section>

      <section className="{args.tool_id}-panel">
        <p>Replace this starter panel with the complete {safe_name} workflow.</p>
      </section>
    </div>
  )
}}
"""
    css_source = f""".{args.tool_id}-panel {{
  background: #fffefa;
  border: 1px solid var(--line);
  border-radius: 14px;
  box-shadow: 0 11px 34px rgba(28, 30, 26, .06);
  min-height: 360px;
  padding: 32px;
}}

.{args.tool_id}-panel p {{
  color: var(--muted);
  line-height: 1.7;
  margin: 0;
}}
"""

    tool_dir.mkdir(parents=True)
    component_path.write_text(component_source, encoding="utf-8")
    css_path.write_text(css_source, encoding="utf-8")
    registry_path.write_text(updated_registry, encoding="utf-8")

    print(f"Created src/tools/{args.tool_id}/{component}.tsx")
    print(f"Created src/tools/{args.tool_id}/{component}.css")
    print(f"Registered {args.tool_id} in src/tools/registry.ts")
    print("Next: implement the workflow, add responsive styles, and run npm run build.")


if __name__ == "__main__":
    main()
