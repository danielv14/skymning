import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { getEntriesForWeek } from '../../../../server/functions/entries'
import {
  getWeeklySummary,
  createWeeklySummary,
  updateWeeklySummary,
  getCurrentWeek,
} from '../../../../server/functions/weeklySummaries'
import { generateWeeklySummary } from '../../../../server/ai'
import { MoodEmoji } from '../../../../components/mood/MoodEmoji'
import { Button } from '../../../../components/ui/Button'
import { Card } from '../../../../components/ui/Card'
import { StarField } from '../../../../components/StarField'
import { RegenerateConfirmModal } from '../../../../components/reflection/RegenerateConfirmModal'
import { ChevronLeft, ChevronRight, Home, RotateCw } from 'lucide-react'
import { useState } from 'react'
import { format, parseISO, getISOWeek, getISOWeekYear, addWeeks, subWeeks } from 'date-fns'
import { sv } from 'date-fns/locale'
import { getWeekMoodDescription } from '../../../../constants/mood'

const getDateFromISOWeek = (year: number, week: number) => {
  const jan4 = new Date(year, 0, 4)
  const dayOfWeek = jan4.getDay() || 7
  const firstThursday = new Date(jan4)
  firstThursday.setDate(jan4.getDate() - dayOfWeek + 4)
  const targetDate = new Date(firstThursday)
  targetDate.setDate(firstThursday.getDate() + (week - 1) * 7)
  return targetDate
}

const getAdjacentWeek = (year: number, week: number, direction: 'prev' | 'next') => {
  const date = getDateFromISOWeek(year, week)
  const adjacentDate = direction === 'prev' ? subWeeks(date, 1) : addWeeks(date, 1)
  return { year: getISOWeekYear(adjacentDate), week: getISOWeek(adjacentDate) }
}

const TimelineWeekPage = () => {
  const { year, week, entries, weeklySummary, averageMood } = Route.useLoaderData()
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)

  const currentWeek = getCurrentWeek()
  const isCurrentWeek = year === currentWeek.year && week === currentWeek.week

  const handleSummaryGeneration = async (isRegenerate: boolean) => {
    if (entries.length === 0) return

    const setLoading = isRegenerate ? setIsRegenerating : setIsGenerating
    if (isRegenerate) setConfirmModalOpen(false)

    setLoading(true)
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

      const saveFn = isRegenerate ? updateWeeklySummary : createWeeklySummary
      await saveFn({
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
      setLoading(false)
    }
  }

  const handleGenerateSummary = () => handleSummaryGeneration(false)
  const handleRegenerateSummary = () => handleSummaryGeneration(true)

  const prevWeek = getAdjacentWeek(year, week, 'prev')
  const nextWeek = getAdjacentWeek(year, week, 'next')

  const weekLabel = `Vecka ${week}, ${year}`
  const moodDescription = getWeekMoodDescription(averageMood)

  return (
    <>
      <RegenerateConfirmModal
        open={confirmModalOpen}
        onOpenChange={setConfirmModalOpen}
        onConfirm={handleRegenerateSummary}
        isLoading={isRegenerating}
      />
      <div className="min-h-screen">
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
        {weeklySummary ? (
          <Card gradient>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3 mb-3">
              <h2 className="text-lg font-semibold text-white">Veckans summering</h2>
              <div className="flex items-center gap-3">
                {moodDescription && (
                  <span className="text-sm text-slate-400">{moodDescription}</span>
                )}
                <button
                  onClick={() => setConfirmModalOpen(true)}
                  disabled={isRegenerating}
                  className="text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Regenerera summering"
                >
                  <RotateCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                </button>
              </div>
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

        {entries.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-200 px-1">Veckans dagar</h2>
            <div className="space-y-4 stagger-children">
              {entries.map((entry) => (
                <Card key={entry.id}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-slate-500 capitalize">
                      {format(parseISO(entry.date), 'EEEE d MMMM', { locale: sv })}
                    </p>
                    <MoodEmoji mood={entry.mood} size="md" layout="horizontal" />
                  </div>
                  <p className="text-slate-300">{entry.summary}</p>
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
    </>
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
