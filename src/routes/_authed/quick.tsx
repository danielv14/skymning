import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { getTodayEntry, createEntry } from '../../server/functions/entries'
import { MoodSelector } from '../../components/reflection/MoodSelector'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Textarea } from '../../components/ui/Textarea'
import { PageHeader } from '../../components/ui/PageHeader'
import { QuickPolishModal } from '../../components/reflection/QuickPolishModal'

const QuickPage = () => {
  const router = useRouter()
  const { todayEntry } = Route.useLoaderData()
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [summary, setSummary] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [polishModalOpen, setPolishModalOpen] = useState(false)

  if (todayEntry) {
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
        },
      })
      router.navigate({ to: '/' })
    } catch (error) {
      console.error('Failed to save entry:', error)
      toast.error('Kunde inte spara dagens reflektion')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUsePolished = (polishedText: string) => {
    setSummary(polishedText)
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <QuickPolishModal
        open={polishModalOpen}
        onOpenChange={setPolishModalOpen}
        originalText={summary}
        onUse={handleUsePolished}
      />

      <PageHeader
        title="Skriv själv"
        subtitle="Reflektera utan AI-chatt"
      />

      <main className="max-w-2xl mx-auto p-6 sm:p-8 space-y-6">
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
            onClick={() => router.navigate({ to: '/reflect' })}
            className="w-full sm:w-auto"
          >
            Prata med AI istället
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

export const Route = createFileRoute('/_authed/quick')({
  head: () => ({
    meta: [{ title: 'Skriv själv - Skymning' }],
  }),
  loader: async () => {
    const todayEntry = await getTodayEntry()
    return { todayEntry }
  },
  component: QuickPage,
})
