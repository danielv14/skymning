import { Link } from '@tanstack/react-router'
import type { Entry } from '../../server/db/schema'
import { MoodEmoji } from '../mood/MoodEmoji'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

type TodayEntryCardProps = {
  entry: Entry | null
  hasChatPreview: boolean
}

export const TodayEntryCard = ({ entry, hasChatPreview }: TodayEntryCardProps) => {
  return (
    <Card gradient>
      {entry ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Dagens reflektion</h2>
            <MoodEmoji mood={entry.mood} size="lg" layout="horizontal" />
          </div>
          <p className="text-slate-300">{entry.summary}</p>
          <p className="text-sm text-slate-500">
            Du har redan reflekterat idag
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Hur var din dag?</h2>
          <p className="text-slate-300">
            Ta en stund att reflektera över dagens händelser och känslor.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/reflect" className="flex-1">
              <Button className="w-full">
                {hasChatPreview ? 'Fortsätt chatta' : 'Prata med AI'}
              </Button>
            </Link>
            <Link to="/quick" className="flex-1">
              <Button variant="secondary" className="w-full">Skriv själv</Button>
            </Link>
          </div>
        </div>
      )}
    </Card>
  )
}
