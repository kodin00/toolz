import type { SVGProps } from 'react'

export type IconName =
  | 'arrow'
  | 'back'
  | 'bolt'
  | 'check'
  | 'chevron'
  | 'download'
  | 'drop'
  | 'image'
  | 'info'
  | 'layers'
  | 'more'
  | 'palette'
  | 'plus'
  | 'search'
  | 'shield'
  | 'sparkle'
  | 'upload'

const paths: Record<IconName, React.ReactNode> = {
  arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  back: <><path d="m15 18-6-6 6-6" /><path d="M9 12h10" /></>,
  bolt: <path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z" />,
  check: <path d="m5 12 4 4L19 6" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  download: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></>,
  drop: <path d="M12 2s6 6.1 6 11a6 6 0 0 1-12 0c0-4.9 6-11 6-11Z" />,
  image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9" r="1.5" /><path d="m21 15-5-5L5 20" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" /></>,
  layers: <><path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5" /><path d="m3 17 9 5 9-5" /></>,
  more: <><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></>,
  palette: <><path d="M12 3a9 9 0 1 0 0 18h1.2a1.8 1.8 0 0 0 1.4-3c-.7-.8-.1-2 1-2H18a3 3 0 0 0 3-3c0-5.5-4-10-9-10Z" /><circle cx="7.5" cy="10" r=".7" fill="currentColor" /><circle cx="10" cy="6.5" r=".7" fill="currentColor" /><circle cx="15" cy="7.5" r=".7" fill="currentColor" /></>,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  shield: <><path d="M12 3 4.5 6v5c0 5 3.2 8.2 7.5 10 4.3-1.8 7.5-5 7.5-10V6L12 3Z" /><path d="m9 12 2 2 4-4" /></>,
  sparkle: <><path d="m12 3 1.2 4.1L17 9l-3.8 1.9L12 15l-1.2-4.1L7 9l3.8-1.9L12 3Z" /><path d="m18.5 15 .7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3Z" /></>,
  upload: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M5 20h14" /></>,
}

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName
  size?: number
}

export function Icon({ name, size = 20, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      {paths[name]}
    </svg>
  )
}
