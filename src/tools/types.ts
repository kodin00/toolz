import type { ComponentType } from 'react'
import type { IconName } from '../components/Icon'

export type ToolCategory = 'Image' | 'Text' | 'Developer' | 'Files'

export interface ToolDefinition {
  id: string
  name: string
  description: string
  category: ToolCategory
  icon: IconName
  accent: string
  component: ComponentType
  featured?: boolean
}
