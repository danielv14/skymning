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
import { Card } from '../../../../components/ui/Card'
import { StarField } from '../../../../components/StarField'
import { RegenerateConfirmModal } from '../../../../components/reflection/RegenerateConfirmModal'
import { WeeklyEntryCard } from '../../../../components/timeline/WeeklyEntryCard'
import { WeeklySummarySection } from '../../../../components/timeline/WeeklySummarySection'
import { ChevronLeft, ChevronRight, Home } from 'lucide-react'
import { useState } from 'react'
import { getWeekMoodDescription } from '../../../../constants/mood'
import { getAdjacentWeek } from '../../../../utils/isoWeek'

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
  const moodDescription = isCurrentWeek ? null : getWeekMoodDescription(averageMood)

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
        <WeeklySummarySection
          summary={weeklySummary?.summary ?? null}
          hasEntries={entries.length > 0}
          moodDescription={moodDescription}
          onGenerate={handleGenerateSummary}
          onOpenRegenerateModal={() => setConfirmModalOpen(true)}
          isGenerating={isGenerating}
          isRegenerating={isRegenerating}
        />

        {entries.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-200 px-1">Veckans dagar</h2>
            <div className="space-y-4 stagger-children">
              {entries.map((entry) => (
                <WeeklyEntryCard key={entry.id} entry={entry} />
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
