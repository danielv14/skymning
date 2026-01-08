import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { getEntriesForWeek } from '../../../../server/functions/entries'
import {
  getWeeklySummary,
  createWeeklySummary,
  getCurrentWeek,
} from '../../../../server/functions/weeklySummaries'
import { generateWeeklySummary } from '../../../../server/ai'
import { MoodEmoji } from '../../../../components/mood/MoodEmoji'
import { Button } from '../../../../components/ui/Button'
import { Card } from '../../../../components/ui/Card'
import { StarField } from '../../../../components/StarField'
import { ChevronLeft, ChevronRight, Home } from 'lucide-react'
import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { sv } from 'date-fns/locale'
import { getWeekMoodDescription } from '../../../../constants/mood'

const TimelineWeekPage = () => {
  const { year, week, entries, weeklySummary, averageMood } = Route.useLoaderData()
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)

  const currentWeek = getCurrentWeek()
  const isCurrentWeek = year === currentWeek.year && week === currentWeek.week

  const handleGenerateSummary = async () => {
    if (entries.length === 0) return

    setIsGenerating(true)
    try {
      const summaryText = await generateWeeklySummary({
        data: {
          entries: entries.map((e) => ({
            date: e.date,
            mood: e.mood,
            summary: e.summary,
          })),
        },
      })

      await createWeeklySummary({
        data: {
          year,
          week,
          summary: typeof summaryText === 'string' ? summaryText : String(summaryText),
        },
      })

      router.invalidate()
    } catch (error) {
      console.error('Failed to generate summary:', error)
      toast.error('Kunde inte generera veckosummering')
    } finally {
      setIsGenerating(false)
    }
  }

  const prevWeek = week === 1 ? { year: year - 1, week: 52 } : { year, week: week - 1 }
  const nextWeek = week === 52 ? { year: year + 1, week: 1 } : { year, week: week + 1 }

  const weekLabel = `Vecka ${week}, ${year}`
  const moodDescription = getWeekMoodDescription(averageMood)

  return (
    <div className="min-h-screen">
      {/* Header med gradient */}
      <header className="bg-horizon relative overflow-hidden py-6 sm:py-8 px-6 sm:px-8">
        <StarField starCount={20} />
        <div className="max-w-2xl mx-auto relative z-10">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <Link to="/">
              <button className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer">
                <Home className="w-5 h-5 text-slate-200" />
              </button>
            </Link>
            <div className="text-center">
              <h1 className="text-xl font-semibold text-white">{weekLabel}</h1>
            </div>
            <div className="w-9" /> {/* Spacer */}
          </div>

          <div className="flex justify-between items-center">
            <Link
              to="/timeline/$year/$week"
              params={{ year: String(prevWeek.year), week: String(prevWeek.week) }}
              viewTransition={false}
            >
              <button className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer">
                <ChevronLeft className="w-4 h-4" />
                Förra
              </button>
            </Link>
            <Link
              to="/timeline/$year/$week"
              params={{ year: String(currentWeek.year), week: String(currentWeek.week) }}
              viewTransition={false}
              disabled={isCurrentWeek}
            >
              <button
                className="text-slate-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-slate-300"
                disabled={isCurrentWeek}
              >
                Denna vecka
              </button>
            </Link>
            <Link
              to="/timeline/$year/$week"
              params={{ year: String(nextWeek.year), week: String(nextWeek.week) }}
              viewTransition={false}
            >
              <button className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer">
                Nästa
                <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6 sm:p-8 space-y-6 sm:space-y-8 -mt-4">
        {/* Veckosummering */}
        {weeklySummary ? (
          <Card gradient>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-white">Veckans summering</h2>
              {moodDescription && (
                <span className="text-sm text-slate-400">{moodDescription}</span>
              )}
            </div>
            <p className="text-slate-300">{weeklySummary.summary}</p>
          </Card>
        ) : entries.length > 0 ? (
          <Card gradient>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-white">Veckans summering</h2>
              {moodDescription && (
                <span className="text-sm text-slate-400">{moodDescription}</span>
              )}
            </div>
            <p className="text-slate-400 mb-4">
              Ingen summering finns ännu för denna vecka.
            </p>
            <Button onClick={handleGenerateSummary} disabled={isGenerating}>
              {isGenerating ? 'Genererar...' : 'Generera summering'}
            </Button>
          </Card>
        ) : null}

        {/* Veckans inlägg */}
        {entries.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-200 px-1">Veckans dagar</h2>
            <div className="space-y-4 stagger-children">
              {entries.map((entry) => (
                <Card key={entry.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-slate-500 mb-1 capitalize">
                        {format(parseISO(entry.date), 'EEEE d MMMM', { locale: sv })}
                      </p>
                      <p className="text-slate-300">{entry.summary}</p>
                    </div>
                    <MoodEmoji mood={entry.mood} size="md" layout="horizontal" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <Card>
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🌑</div>
              <p className="text-slate-400 mb-2">Inga reflektioner denna vecka</p>
              <p className="text-slate-500 text-sm">
                Kom ihåg att ta en stund varje kväll för att reflektera
              </p>
            </div>
          </Card>
        )}
      </main>
    </div>
  )
}

export const Route = createFileRoute('/_authed/timeline/$year/$week')({
  loader: async ({ params }) => {
    const year = parseInt(params.year, 10)
    const week = parseInt(params.week, 10)

    if (isNaN(year) || isNaN(week) || week < 1 || week > 53 || year < 2020 || year > 2100) {
      throw new Error('Ogiltiga parametrar för vecka')
    }

    const [entries, weeklySummary] = await Promise.all([
      getEntriesForWeek({ data: { year, week } }),
      getWeeklySummary({ data: { year, week } }),
    ])

    const averageMood = entries.length > 0
      ? entries.reduce((sum, e) => sum + e.mood, 0) / entries.length
      : null

    return {
      year,
      week,
      entries,
      weeklySummary,
      averageMood,
    }
  },
  head: ({ params }) => ({
    meta: [{ title: `Vecka ${params.week}, ${params.year} - Skymning` }],
  }),
  component: TimelineWeekPage,
})
