import { MoodEmoji } from '../mood/MoodEmoji'

type MoodSelectorProps = {
  value: number | null
  onChange: (mood: number) => void
}

export const MoodSelector = ({ value, onChange }: MoodSelectorProps) => {
  return (
    <div className="flex justify-around py-2">
      {[1, 2, 3, 4, 5].map((mood) => (
        <button
          key={mood}
          type="button"
          onClick={() => onChange(mood)}
          className={`p-3 rounded-2xl transition-all ${
            value === mood ? 'scale-110' : 'hover:bg-slate-700/50'
          }`}
          style={
            value === mood
              ? {
                  backgroundColor: `color-mix(in srgb, var(--color-mood-${mood}) 12%, transparent)`,
                  boxShadow: `0 0 0 2px var(--color-mood-${mood})`,
                }
              : undefined
          }
        >
          <MoodEmoji mood={mood} size="lg" showLabel />
        </button>
      ))}
    </div>
  )
}
