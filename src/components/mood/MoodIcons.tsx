type IconProps = {
  size?: number
  className?: string
}

// Level 1: Thunderstorm - heavy and dark
export const MoodStormy = ({ size = 24, className = '' }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M17.5 17H7a4 4 0 0 1-.5-7.97 5 5 0 0 1 9.77-1.5A3.5 3.5 0 1 1 17.5 17Z" />
    <path d="M12 17l-2 5 4-2-2 4" strokeWidth="1.5" />
  </svg>
)

// Level 2: Rainy - a bit grey
export const MoodRainy = ({ size = 24, className = '' }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M17.5 15H7a4 4 0 0 1-.5-7.97 5 5 0 0 1 9.77-1.5A3.5 3.5 0 1 1 17.5 15Z" />
    <path d="M8 19v2" />
    <path d="M12 19v2" />
    <path d="M16 19v2" />
  </svg>
)

// Level 3: Cloudy - neutral
export const MoodCloudy = ({ size = 24, className = '' }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="8" cy="9" r="3" opacity="0.4" />
    <path d="M17.5 17H9a4 4 0 0 1-.5-7.97 5 5 0 0 1 9.77-1.5A3.5 3.5 0 1 1 17.5 17Z" />
  </svg>
)

// Level 4: Sun with light clouds - good feeling
export const MoodPartlySunny = ({ size = 24, className = '' }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="9" cy="9" r="3" />
    <path d="M9 2v2" />
    <path d="M9 14v2" opacity="0.3" />
    <path d="M2 9h2" />
    <path d="M4.2 4.2l1.4 1.4" />
    <path d="M12.4 4.2l-1.4 1.4" />
    <path d="M19 17h-5a2.5 2.5 0 0 1-.3-5 3 3 0 0 1 5.9.9A2 2 0 1 1 19 17Z" />
  </svg>
)

// Level 5: Bright sun - great
export const MoodSunny = ({ size = 24, className = '' }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="M4.93 4.93l1.41 1.41" />
    <path d="M17.66 17.66l1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="M6.34 17.66l-1.41 1.41" />
    <path d="M19.07 4.93l-1.41 1.41" />
  </svg>
)

export const MOOD_ICONS = {
  1: MoodStormy,
  2: MoodRainy,
  3: MoodCloudy,
  4: MoodPartlySunny,
  5: MoodSunny,
} as const

export const getMoodIcon = (mood: number) => {
  return MOOD_ICONS[mood as keyof typeof MOOD_ICONS] ?? MOOD_ICONS[3]
}

// Streak-ikon: Eld/flamma
export const StreakFlame = ({ size = 24, className = '' }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 22c-4 0-7-2.5-7-7 0-3.5 2-6 4-8 .5 2.5 2 4 4 4 1.5-3 1-6-1-8 4 1 7 5 7 10 0 4.5-3 9-7 9Z" />
    <path d="M12 22c-1.5 0-3-1-3-3.5 0-2 1-3.5 2-4.5.5 1 1 2 2 2 .5-1.5.5-3 0-4 1.5.5 3 2.5 3 5 0 2.5-1.5 5-4 5Z" />
  </svg>
)
