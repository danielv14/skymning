import { useState } from 'react'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { dateString, MAX_DAYS_TO_FILL_IN } from '../../constants'
import { differenceInDays, isFuture, parseISO, startOfDay } from 'date-fns'
import { getTodayEntry, createEntry, getEntryForDate } from '../../server/functions/entries'
import { clearPastChats } from '../../server/functions/chat'
import { MoodSelector } from '../../components/reflection/MoodSelector'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Textarea } from '../../components/ui/Textarea'
import { PageHeader } from '../../components/ui/PageHeader'
import { QuickPolishModal } from '../../components/reflection/QuickPolishModal'
import { formatRelativeDay } from '../../utils/date'

const QuickPage = () => {
  const router = useRouter()
  const { existingEntry, targetDate } = Route.useLoaderData()
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [summary, setSummary] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [polishModalOpen, setPolishModalOpen] = useState(false)

  if (existingEntry) {
    router.navigate({ to: '/' })
    return null
  }

  const handleSave = async () => {
    if (!selectedMood || !summary.trim()) return

    setIsSaving(true)
    try {
      await createEntry({
        data: {
          mood: selectedMood,
          summary: summary.trim(),
          ...(targetDate && { date: targetDate }),
        },
      })
      await clearPastChats()
      router.navigate({ to: '/', viewTransition: true })
    } catch (error) {
      console.error('Failed to save entry:', error)
      toast.error('Kunde inte spara reflektionen')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUsePolished = (polishedText: string) => {
    setSummary(polishedText)
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <QuickPolishModal
        open={polishModalOpen}
        onOpenChange={setPolishModalOpen}
        originalText={summary}
        onUse={handleUsePolished}
      />

      <PageHeader
        title="Skriv själv"
        subtitle={targetDate ? `Reflektion för ${formatRelativeDay(targetDate)}` : 'Reflektera utan AI-chatt'}
      />

      <main className="max-w-2xl mx-auto p-6 sm:p-8 space-y-6 sm:space-y-8 stagger-children">
        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">
            Hur har din dag varit?
          </h2>
          <MoodSelector value={selectedMood} onChange={setSelectedMood} />
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-white mb-2">
            Sammanfatta dagen
          </h2>
          <p className="text-slate-400 text-sm mb-4">
            Skriv några rader om vad som hände eller hur du kände dig
          </p>
          <Textarea
            value={summary}
            onChange={setSummary}
            placeholder="T.ex. En lugn dag på jobbet. Tog en promenad på lunchen och kände mig avslappnad..."
            rows={4}
          />
          <div className="flex justify-between items-center mt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPolishModalOpen(true)}
              disabled={summary.length < 20}
            >
              Förbättra med AI
            </Button>
            <p className="text-sm text-slate-500">
              {summary.length} tecken
            </p>
          </div>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() => router.navigate({ to: '/reflect', viewTransition: true })}
            className="w-full sm:w-auto"
          >
            Chatta istället
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedMood || !summary.trim() || isSaving}
            className="flex-1 min-w-0 sm:min-w-fit"
          >
            {isSaving ? 'Sparar...' : 'Spara dagen'}
          </Button>
        </div>
      </main>
    </div>
  )
}

const searchSchema = z.object({
  date: dateString.optional(),
})

export const Route = createFileRoute('/_authed/quick')({
  head: () => ({
    meta: [{ title: 'Skriv själv - Skymning' }],
  }),
  validateSearch: (search) => searchSchema.parse(search),
  loaderDeps: ({ search }) => ({ date: search.date }),
  loader: async ({ deps }) => {
    const targetDate = deps.date ?? null

    if (targetDate) {
      const parsedDate = parseISO(targetDate)
      const today = startOfDay(new Date())
      const daysAgo = differenceInDays(today, startOfDay(parsedDate))

      if (isFuture(parsedDate) || daysAgo > MAX_DAYS_TO_FILL_IN) {
        throw redirect({ to: '/' })
      }

      const existingEntry = await getEntryForDate({ data: { date: targetDate } })
      return { existingEntry, targetDate }
    }

    const existingEntry = await getTodayEntry()
    return { existingEntry, targetDate }
  },
  component: QuickPage,
})
