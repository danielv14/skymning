import { MOODS } from '../../constants'
import { MoodEmoji } from '../mood/MoodEmoji'

type MoodSelectorProps = {
  value: number | null
  onChange: (mood: number) => void
}

export const MoodSelector = ({ value, onChange }: MoodSelectorProps) => {
  return (
    <div className="flex justify-around py-2">
      {MOODS.map(({ value: moodValue, name }) => {
        const cssVar = `--color-mood-${name}`
        return (
          <button
            key={moodValue}
            type="button"
            onClick={() => onChange(moodValue)}
            className={`p-3 rounded-2xl transition-all ${
              value === moodValue ? 'scale-110' : 'hover:bg-slate-700/50'
            }`}
            style={
              value === moodValue
                ? {
                    backgroundColor: `color-mix(in srgb, var(${cssVar}) 12%, transparent)`,
                    boxShadow: `0 0 0 2px var(${cssVar})`,
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
