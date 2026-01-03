import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { getUserContext, updateUserContext } from '../server/functions/userContext'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { Check } from 'lucide-react'

const AboutMePage = () => {
  const { userContext } = Route.useLoaderData()
  const [content, setContent] = useState(userContext.content)
  const [isSaving, setIsSaving] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setHasChanges(content !== userContext.content)
  }, [content, userContext.content])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateUserContext({ data: { content } })
      setShowSaved(true)
      setHasChanges(false)
      setTimeout(() => setShowSaved(false), 2000)
    } catch (error) {
      console.error('Failed to save context:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <PageHeader
        title="Om mig"
        subtitle="Personlig kontext för AI:n"
      />

      <main className="max-w-2xl mx-auto p-6 sm:p-8 space-y-6">
        <Card>
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">
                Berätta om dig själv
              </h2>
              <p className="text-slate-400 text-sm">
                Skriv information som du vill att AI:n ska känna till när ni pratar. 
                Till exempel vilka dina barn heter, vad du jobbar med, eller andra saker 
                som ger kontext till dina reflektioner.
              </p>
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="T.ex. Jag heter Anna och bor i Stockholm. Jag har två barn, Gustav (8 år) och Oscar (5 år). Jag jobbar som lärare på en grundskola..."
              rows={10}
              className="w-full px-4 py-3 rounded-xl border border-slate-600 bg-slate-700/50 text-slate-100 placeholder-slate-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors resize-none"
            />

            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                {content.length > 0 ? `${content.length} tecken` : 'Inga ändringar'}
              </p>
              <div className="flex items-center gap-3">
                {showSaved && (
                  <span className="flex items-center gap-1 text-green-400 text-sm">
                    <Check className="w-4 h-4" />
                    Sparat
                  </span>
                )}
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving || !hasChanges}
                >
                  {isSaving ? 'Sparar...' : 'Spara'}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-slate-800/50">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-300">Hur används detta?</h3>
            <p className="text-sm text-slate-400">
              Informationen du skriver här inkluderas automatiskt i alla dina samtal med AI:n. 
              Det hjälper AI:n att förstå din situation bättre och ge mer relevanta svar utan 
              att du behöver upprepa samma kontext varje gång.
            </p>
          </div>
        </Card>
      </main>
    </div>
  )
}

export const Route = createFileRoute('/about-me')({
  head: () => ({
    meta: [{ title: 'Om mig - Skymning' }],
  }),
  loader: async () => {
    const userContext = await getUserContext()
    return { userContext }
  },
  component: AboutMePage,
})
