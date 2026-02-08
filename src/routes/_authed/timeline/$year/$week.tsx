import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useState } from 'react'
import { getDay } from 'date-fns'
import { ChevronLeft, ChevronRight, Home } from 'lucide-react'
import { getEntriesForWeek } from '../../../../server/functions/entries'
import {
  getWeeklySummary,
  createWeeklySummary,
  updateWeeklySummary,
  getCurrentWeek,
} from '../../../../server/functions/weeklySummaries'
import { generateWeeklySummary } from '../../../../server/ai'
import { AppHeader } from '../../../../components/ui/AppHeader'
import { RegenerateConfirmModal } from '../../../../components/reflection/RegenerateConfirmModal'
import { EditWeeklySummaryModal } from '../../../../components/timeline/EditWeeklySummaryModal'
import { TimelineDayItem } from '../../../../components/timeline/TimelineDayItem'
import { WeeklySummarySection } from '../../../../components/timeline/WeeklySummarySection'
import { getWeekMoodDescription } from '../../../../constants'
import { getAdjacentWeek, getWeekDays } from '../../../../utils/isoWeek'
import { getTodayDateString } from '../../../../utils/date'
import '../../../../components/timeline/timeline.css'

const TimelineWeekPage = () => {
  const { year, week, entries, weeklySummary, averageMood, weekDays } = Route.useLoaderData()
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)

  const currentWeek = getCurrentWeek()
  const isCurrentWeek = year === currentWeek.year && week === currentWeek.week

  // Create a map of date -> entry for quick lookup
  const entryMap = new Map(entries.map(e => [e.date, e]))

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

  const isSunday = getDay(new Date()) === 0
  const todayDate = getTodayDateString()
  const hasSundayEntry = entries.some((entry) => entry.date === todayDate)
  const isWeekComplete = !isCurrentWeek || (isSunday && hasSundayEntry)
  const moodDescription = isWeekComplete ? getWeekMoodDescription(averageMood) : null

  const weekNavLinkClass = "flex items-center gap-1.5 px-3 py-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 active:bg-white/15 transition-all duration-200"

  return (
    <>
      <RegenerateConfirmModal
        open={confirmModalOpen}
        onOpenChange={setConfirmModalOpen}
        onConfirm={handleRegenerateSummary}
        isLoading={isRegenerating}
      />
      {weeklySummary?.summary && (
        <EditWeeklySummaryModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          year={year}
          week={week}
          summary={weeklySummary.summary}
        />
      )}
      <div className="min-h-screen">
        <AppHeader>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <Link to="/" className="p-2.5 -ml-2 rounded-full hover:bg-white/10 active:bg-white/15 transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 inline-flex">
              <Home className="w-5 h-5 text-slate-200" />
            </Link>
            <div className="text-center">
              <h1 className="text-xl font-semibold text-white">{weekLabel}</h1>
            </div>
            <div className="w-9" />
          </div>

          <div className="flex justify-between items-center">
            <Link
              to="/timeline/$year/$week"
              params={{ year: String(prevWeek.year), week: String(prevWeek.week) }}
              viewTransition={false}
              className={weekNavLinkClass}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Förra</span>
            </Link>
            <Link
              to="/timeline/$year/$week"
              params={{ year: String(currentWeek.year), week: String(currentWeek.week) }}
              viewTransition={false}
              disabled={isCurrentWeek}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${isCurrentWeek ? 'opacity-50 cursor-not-allowed text-slate-300' : 'text-slate-300 hover:text-white hover:bg-white/10 active:bg-white/15'}`}
            >
              Denna vecka
            </Link>
            <Link
              to="/timeline/$year/$week"
              params={{ year: String(nextWeek.year), week: String(nextWeek.week) }}
              viewTransition={false}
              className={weekNavLinkClass}
            >
              <span className="text-sm font-medium">Nästa</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </AppHeader>

      <main className="max-w-2xl mx-auto p-6 sm:p-8 space-y-6 sm:space-y-8">
        <WeeklySummarySection
          summary={weeklySummary?.summary ?? null}
          hasEntries={entries.length > 0}
          moodDescription={moodDescription}
          entryCount={entries.length}
          averageMood={averageMood}
          onGenerate={handleGenerateSummary}
          onOpenRegenerateModal={() => setConfirmModalOpen(true)}
          onEdit={() => setEditModalOpen(true)}
          isGenerating={isGenerating}
          isRegenerating={isRegenerating}
        />

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-200 px-1">Veckans dagar</h2>
          <div className="timeline-container space-y-3">
            {weekDays.map((date) => (
              <TimelineDayItem
                key={date}
                date={date}
                entry={entryMap.get(date) ?? null}
                useRelativeDates={isCurrentWeek}
              />
            ))}
          </div>
        </div>
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

    const weekDays = getWeekDays(year, week)

    return {
      year,
      week,
      entries,
      weeklySummary,
      averageMood,
      weekDays,
    }
  },
  head: ({ params }) => ({
    meta: [{ title: `Vecka ${params.week}, ${params.year} - Skymning` }],
  }),
  component: TimelineWeekPage,
})
