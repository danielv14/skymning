import { getMoodIcon } from './MoodIcons'
import { getMoodLabel } from '../../constants'

type MoodEmojiProps = {
  mood: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  layout?: 'vertical' | 'horizontal'
}

export const MoodEmoji = ({
  mood,
  size = 'md',
  showLabel = true,
  layout = 'vertical',
}: MoodEmojiProps) => {
  const label = getMoodLabel(mood)
  const IconComponent = getMoodIcon(mood)

  const iconSizes = {
    sm: 18,
    md: 24,
    lg: 28,
  }

  if (showLabel) {
    const isHorizontal = layout === 'horizontal'
    return (
      <span className={`inline-flex items-center ${isHorizontal ? 'flex-row gap-2' : 'flex-col gap-1.5'}`}>
        <span className="text-slate-300">
          <IconComponent size={iconSizes[size]} />
        </span>
        <span className="text-xs text-slate-400 font-medium">{label}</span>
      </span>
    )
  }

  return (
    <span className="inline-flex text-slate-300" aria-label={label}>
      <IconComponent size={iconSizes[size]} />
    </span>
  )
}
