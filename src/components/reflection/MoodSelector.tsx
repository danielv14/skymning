import { MOODS } from '../../constants'
import { MoodEmoji } from '../mood/MoodEmoji'

type MoodSelectorProps = {
  value: number | null
  onChange: (mood: number) => void
}

export const MoodSelector = ({ value, onChange }: MoodSelectorProps) => {
  return (
    <div className="flex justify-between">
      {MOODS.map(({ value: moodValue, name }) => {
        const cssVar = `--color-mood-${name}`
        const isSelected = value === moodValue
        return (
          <button
            key={moodValue}
            type="button"
            onClick={() => onChange(moodValue)}
            className={`relative p-3 rounded-2xl transition-all duration-300 cursor-pointer ${
              isSelected
                ? 'scale-110'
                : 'hover:bg-slate-700/30 hover:scale-105 active:scale-95'
            }`}
            style={
              isSelected
                ? {
                    backgroundColor: `color-mix(in srgb, var(${cssVar}) 18%, transparent)`,
                    boxShadow: `0 0 0 2px var(${cssVar}), 0 8px 24px -6px color-mix(in srgb, var(${cssVar}) 40%, transparent)`,
                  }
                : undefined
            }
          >
            <MoodEmoji mood={moodValue} size="lg" showLabel />
          </button>
        )
      })}
    </div>
  )
}
