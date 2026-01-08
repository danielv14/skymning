import { useState, useEffect } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { getUserContext, updateUserContext } from '../../server/functions/userContext'
import { logoutFn } from '../../server/functions/auth'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Textarea } from '../../components/ui/Textarea'
import { PageHeader } from '../../components/ui/PageHeader'
import { Check, LogOut } from 'lucide-react'

const HISTORY_OPTIONS = [
  { value: 0, label: 'Ingen historik' },
  { value: 5, label: '5 reflektioner' },
  { value: 10, label: '10 reflektioner' },
  { value: 20, label: '20 reflektioner' },
]

const AboutMePage = () => {
  const router = useRouter()
  const { userContext } = Route.useLoaderData()
  const [content, setContent] = useState(userContext.content)
  const [historyCount, setHistoryCount] = useState(userContext.historyCount)
  const [isSaving, setIsSaving] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    setHasChanges(
      content !== userContext.content || historyCount !== userContext.historyCount
    )
  }, [content, historyCount, userContext.content, userContext.historyCount])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateUserContext({ data: { content, historyCount } })
      setShowSaved(true)
      setHasChanges(false)
      setTimeout(() => setShowSaved(false), 2000)
    } catch (error) {
      console.error('Failed to save context:', error)
      toast.error('Kunde inte spara inställningarna')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logoutFn()
      router.navigate({ to: '/login' })
    } catch (error) {
      console.error('Failed to logout:', error)
      toast.error('Kunde inte logga ut')
    } finally {
      setIsLoggingOut(false)
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

            <Textarea
              value={content}
              onChange={setContent}
              placeholder="T.ex. Jag heter Anna och bor i Stockholm. Jag har två barn, Gustav (8 år) och Oscar (5 år). Jag jobbar som lärare på en grundskola..."
              rows={8}
            />

            <div className="pt-4 border-t border-slate-700">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Historik i chatten
              </label>
              <p className="text-slate-400 text-sm mb-3">
                Välj hur många tidigare reflektioner AI:n ska ha tillgång till för att ge bättre kontext.
              </p>
              <div className="relative">
                <select
                  value={historyCount}
                  onChange={(e) => setHistoryCount(Number(e.target.value))}
                  className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-600 bg-slate-700/50 text-slate-100 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors appearance-none cursor-pointer"
                >
                  {HISTORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                  <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

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

        <div className="pt-6 border-t border-slate-800">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">{isLoggingOut ? 'Loggar ut...' : 'Logga ut'}</span>
          </button>
        </div>
      </main>
    </div>
  )
}

export const Route = createFileRoute('/_authed/about-me')({
  head: () => ({
    meta: [{ title: 'Om mig - Skymning' }],
  }),
  loader: async () => {
    const userContext = await getUserContext()
    return { userContext }
  },
  component: AboutMePage,
})
