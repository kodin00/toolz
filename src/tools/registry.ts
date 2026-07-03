import { BackgroundRemover } from './background-remover/BackgroundRemover'
import type { ToolDefinition } from './types'

/**
 * Tool modules are registered in one place.
 *
 * To add a tool:
 * 1. Create its self-contained folder under `src/tools`.
 * 2. Import its root component here.
 * 3. Add one metadata object to this array.
 *
 * Removing or editing an entry never changes the shell or another tool.
 */
export const tools: ToolDefinition[] = [
  {
    id: 'background-remover',
    name: 'Background Remover',
    description: 'Pick a color, remove it cleanly, and export a transparent PNG.',
    category: 'Image',
    icon: 'sparkle',
    accent: '#dfff59',
    component: BackgroundRemover,
    featured: true,
  },
]

export function getTool(id: string) {
  return tools.find((tool) => tool.id === id)
}
