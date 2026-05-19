// SL Design System — Icon sprites
// All icons are 16×16 SVG by default (scale with width/height props).

interface IconProps {
  size?: number;
  className?: string;
}

export const Icon = {
  Eye: ({ size = 16, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path
        d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  Camera: ({ size = 16, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path
        d="M1 5.5A1.5 1.5 0 0 1 2.5 4h.9l.8-1.5h5.6L10.6 4h.9A1.5 1.5 0 0 1 13 5.5v6A1.5 1.5 0 0 1 11.5 13h-7A1.5 1.5 0 0 1 3 11.5v-6Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8.5" r="2" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  ),
  Plus: ({ size = 16, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  Pencil: ({ size = 16, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path
        d="M11.06 2.06a1.5 1.5 0 0 1 2.12 2.12L4.5 12.85l-2.83.71.7-2.83 8.69-8.67Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Trash: ({ size = 16, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path
        d="M2 4h12M5 4V2.5A.5.5 0 0 1 5.5 2h5a.5.5 0 0 1 .5.5V4M6 7v5M10 7v5M3 4l1 9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-9"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  ExternalLink: ({ size = 16, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path
        d="M6.5 3H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V9.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M9.5 2H14v4.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 2 7.5 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  DragHandle: ({ size = 16, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <circle cx="5.5" cy="5" r="1.2" fill="currentColor" />
      <circle cx="10.5" cy="5" r="1.2" fill="currentColor" />
      <circle cx="5.5" cy="8.5" r="1.2" fill="currentColor" />
      <circle cx="10.5" cy="8.5" r="1.2" fill="currentColor" />
      <circle cx="5.5" cy="12" r="1.2" fill="currentColor" />
      <circle cx="10.5" cy="12" r="1.2" fill="currentColor" />
    </svg>
  ),
  Check: ({ size = 16, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path
        d="M3 8l4 4 6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Bold: ({ size = 16, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path
        d="M4 8h5a2.5 2.5 0 0 0 0-5H4v5ZM4 8h5.5a2.5 2.5 0 0 1 0 5H4V8Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Italic: ({ size = 14, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
      <path
        d="M5 3h6M3 11h6M8 3 6 11"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  ),
  List: ({ size = 16, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M6 5h7M6 8h7M6 11h7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="3" cy="5" r="1" fill="currentColor" />
      <circle cx="3" cy="8" r="1" fill="currentColor" />
      <circle cx="3" cy="11" r="1" fill="currentColor" />
    </svg>
  ),
  Heading: ({ size = 16, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path
        d="M3 3v10M13 3v10M3 8h10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  Quote: ({ size = 16, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path
        d="M3 7.5c0-2 1.2-3.5 3-4L7 5c-1 .5-1.5 1-1.5 2H7v3.5H3V7.5ZM9 7.5c0-2 1.2-3.5 3-4L13 5c-1 .5-1.5 1-1.5 2H13v3.5H9V7.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Link: ({ size = 16, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path
        d="M6.5 9.5a3.5 3.5 0 0 0 5 0l2-2a3.5 3.5 0 0 0-5-5L7.5 3.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M9.5 6.5a3.5 3.5 0 0 0-5 0l-2 2a3.5 3.5 0 0 0 5 5l1-1"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  ),
  ChevronDown: ({ size = 16, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Sparkle: ({ size = 20, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M10 2l1.5 5.5L17 9l-5.5 1.5L10 16l-1.5-5.5L3 9l5.5-1.5L10 2Z"
        fill="#E040FB"
        opacity="0.85"
      />
    </svg>
  ),
  Upload: ({ size = 16, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path
        d="M8 11V4M5 7l3-3 3 3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 12v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-1"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  ),
  Globe: ({ size = 16, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 2c-1.5 2-2.5 3.8-2.5 6s1 4 2.5 6" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 2c1.5 2 2.5 3.8 2.5 6S9.5 12 8 14" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2.3 6h11.4M2.3 10h11.4" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  ),
} as const;
