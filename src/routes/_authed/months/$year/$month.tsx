import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Home } from 'lucide-react'
import { toast } from 'sonner'
import {
  getMonthlyOverview,
  createMonthlySummary,
  updateMonthlySummary,
} from '../../../../server/functions/monthlySummaries'
import type { WeekOverview } from '../../../../server/functions/monthlySummaries'
import type { Entry } from '../../../../server/db/schema'
import { generateMonthlySummary } from '../../../../server/ai'
import { AppHeader } from '../../../../components/ui/AppHeader'
import { RegenerateConfirmModal } from '../../../../components/reflection/RegenerateConfirmModal'
import { MonthlySummarySection } from '../../../../components/months/MonthlySummarySection'
import { EditMonthlySummaryModal } from '../../../../components/months/EditMonthlySummaryModal'
import { MonthlyCalendarHeatmap } from '../../../../components/months/MonthlyCalendarHeatmap'
import { MoodDistributionCard } from '../../../../components/months/MoodDistributionCard'
import { MonthComparisonCard } from '../../../../components/months/MonthComparisonCard'
import { BestWorstWeekCard } from '../../../../components/months/BestWorstWeekCard'
import { getPeriodMoodDescription } from '../../../../constants'

const getAdjacentMonth = (year: number, month: number, direction: 'prev' | 'next') => {
  if (direction === 'prev') {
    return month === 1
      ? { year: year - 1, month: 12 }
      : { year, month: month - 1 }
  }
  return month === 12
    ? { year: year + 1, month: 1 }
    : { year, month: month + 1 }
}

const getCurrentMonth = () => {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

const MonthlyOverviewPage = () => {
  const { year, month, overview } = Route.useLoaderData()
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)

  const currentMonth = getCurrentMonth()
  const isCurrentMonth = year === currentMonth.year && month === currentMonth.month

  const monthDate = new Date(year, month - 1, 1)
  const monthLabel = format(monthDate, 'LLLL yyyy', { locale: sv })
  const capitalizedMonthLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)

  const prevMonth = getAdjacentMonth(year, month, 'prev')
  const nextMonth = getAdjacentMonth(year, month, 'next')

  const moodDescription = getPeriodMoodDescription(overview.overallAverage)

  const allEntries = overview.weeks.flatMap((weekData: WeekOverview) => weekData.entries)

  const previousMonthDate = new Date(year, month - 2, 1)

  const handleSummaryGeneration = async (isRegenerate: boolean) => {
    if (overview.totalEntries === 0) return

    const setLoading = isRegenerate ? setIsRegenerating : setIsGenerating
    if (isRegenerate) setConfirmModalOpen(false)

    setLoading(true)
    try {
      const allWeeklySummaries = overview.weeks
        .filter((weekData: WeekOverview) => weekData.weeklySummary !== null)
        .map((weekData: WeekOverview) => ({
          year: weekData.year,
          week: weekData.week,
          summary: weekData.weeklySummary!.summary,
        }))

      const summaryText = await generateMonthlySummary({
        data: {
          entries: allEntries.map((entry: Entry) => ({
            date: entry.date,
            mood: entry.mood,
            summary: entry.summary,
          })),
          weeklySummaries: allWeeklySummaries,
        },
      })

      const saveFn = isRegenerate ? updateMonthlySummary : createMonthlySummary
      await saveFn({
        data: {
          year,
          month,
          summary: typeof summaryText === 'string' ? summaryText : String(summaryText),
        },
      })

      router.invalidate()
    } catch (error) {
      console.error('Failed to generate monthly summary:', error)
      toast.error('Kunde inte generera månadssummering')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateSummary = () => handleSummaryGeneration(false)
  const handleRegenerateSummary = () => handleSummaryGeneration(true)

  const monthNavLinkClass = "flex items-center gap-1.5 px-3 py-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 active:bg-white/15 transition-all duration-200"

  return (
    <>
      <RegenerateConfirmModal
        open={confirmModalOpen}
        onOpenChange={setConfirmModalOpen}
        onConfirm={handleRegenerateSummary}
        isLoading={isRegenerating}
      />
      {overview.monthlySummary?.summary && (
        <EditMonthlySummaryModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          year={year}
          month={month}
          summary={overview.monthlySummary.summary}
        />
      )}
      <div className="min-h-screen">
        <AppHeader>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <Link to="/" viewTransition className="p-2.5 -ml-2 rounded-full hover:bg-white/10 active:bg-white/15 transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 inline-flex">
              <Home className="w-5 h-5 text-slate-200" />
            </Link>
            <div className="text-center">
              <h1 className="text-xl font-semibold text-white">{capitalizedMonthLabel}</h1>
            </div>
            <div className="w-9" />
          </div>

          <div className="flex justify-between items-center">
            <Link
              to="/months/$year/$month"
              params={{ year: String(prevMonth.year), month: String(prevMonth.month) }}
              viewTransition={false}
              className={monthNavLinkClass}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Förra</span>
            </Link>
            <Link
              to="/months/$year/$month"
              params={{ year: String(currentMonth.year), month: String(currentMonth.month) }}
              viewTransition={false}
              disabled={isCurrentMonth}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${isCurrentMonth ? 'opacity-50 cursor-not-allowed text-slate-300' : 'text-slate-300 hover:text-white hover:bg-white/10 active:bg-white/15'}`}
            >
              Denna månad
            </Link>
            <Link
              to="/months/$year/$month"
              params={{ year: String(nextMonth.year), month: String(nextMonth.month) }}
              viewTransition={false}
              className={monthNavLinkClass}
            >
              <span className="text-sm font-medium">Nästa</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </AppHeader>

        <main className="max-w-2xl mx-auto p-6 sm:p-8">
          <div className="bento-grid stagger-children">
            <div className="bento-full">
              <MonthlyCalendarHeatmap year={year} month={month} entries={allEntries} />
            </div>

            <MoodDistributionCard entries={allEntries} />

            <MonthComparisonCard
              currentAverage={overview.overallAverage}
              previousAverage={overview.previousMonthAverage}
              previousMonth={previousMonthDate}
            />

            <div className="bento-full">
              <BestWorstWeekCard weeks={overview.weeks} />
            </div>

            <div className="bento-full">
              <MonthlySummarySection
                summary={overview.monthlySummary?.summary ?? null}
                hasEntries={overview.totalEntries > 0}
                moodDescription={moodDescription}
                entryCount={overview.totalEntries}
                averageMood={overview.overallAverage}
                onGenerate={handleGenerateSummary}
                onOpenRegenerateModal={() => setConfirmModalOpen(true)}
                onEdit={() => setEditModalOpen(true)}
                isGenerating={isGenerating}
                isRegenerating={isRegenerating}
              />
            </div>
          </div>
        </main>
      </div>
    </>
  )
}

export const Route = createFileRoute('/_authed/months/$year/$month')({
  loader: async ({ params }) => {
    const year = parseInt(params.year, 10)
    const month = parseInt(params.month, 10)

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12 || year < 2020 || year > 2100) {
      throw new Error('Ogiltiga parametrar för månad')
    }

    const overview = await getMonthlyOverview({ data: { year, month } })

    return {
      year,
      month,
      overview,
    }
  },
  head: ({ params }) => {
    const monthDate = new Date(parseInt(params.year, 10), parseInt(params.month, 10) - 1, 1)
    const monthName = format(monthDate, 'LLLL yyyy', { locale: sv })
    const capitalizedName = monthName.charAt(0).toUpperCase() + monthName.slice(1)
    return {
      meta: [{ title: `${capitalizedName} - Skymning` }],
    }
  },
  component: MonthlyOverviewPage,
})
