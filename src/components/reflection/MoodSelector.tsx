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
            value === mood
              ? 'bg-emerald-500/20 scale-110 ring-2 ring-emerald-400'
              : 'hover:bg-slate-700/50'
          }`}
        >
          <MoodEmoji mood={mood} size="lg" showLabel />
        </button>
      ))}
    </div>
  )
}
