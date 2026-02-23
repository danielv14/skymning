import { useState, useEffect } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { getUserContext, updateUserContext } from '../../server/functions/userContext'
import { logoutFn } from '../../server/functions/auth'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Textarea } from '../../components/ui/Textarea'
import { PageHeader } from '../../components/ui/PageHeader'
import { format, parseISO } from 'date-fns'
import { sv } from 'date-fns/locale'
import { Check, Info, LogOut } from 'lucide-react'

const AboutMePage = () => {
  const router = useRouter()
  const { userContext } = Route.useLoaderData()
  const [content, setContent] = useState(userContext.content)
  const [isSaving, setIsSaving] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    setHasChanges(content !== userContext.content)
  }, [content, userContext.content])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateUserContext({ data: { content } })
      await router.invalidate()
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
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        title="Om mig"
        subtitle="Personlig kontext för AI:n"
      />

      <main className="max-w-2xl mx-auto p-6 sm:p-8 space-y-6 sm:space-y-8 stagger-children">
        <Card>
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">
                Berätta om dig själv
              </h2>
              <p className="text-slate-400 text-sm sm:text-base">
                Skriv information som du vill att AI:n ska känna till när ni pratar.
                Till exempel vilka dina barn heter, vad du jobbar med, eller andra saker
                som ger kontext till dina reflektioner.
              </p>
            </div>

            <div>
              <Textarea
                value={content}
                onChange={setContent}
                placeholder="T.ex. Jag heter Anna och bor i Stockholm. Jag har två barn, Gustav (8 år) och Oscar (5 år). Jag jobbar som lärare på en grundskola..."
                rows={8}
                maxLength={2000}
              />
              <div className="flex items-baseline justify-between mt-2">
                <p className="text-sm text-slate-500">
                  {content.length > 0 ? `${content.length}/2000 tecken` : 'Inga ändringar'}
                </p>
                {userContext.updatedAt && (
                  <p className="text-sm text-slate-500">
                    Uppdaterad {format(parseISO(userContext.updatedAt), 'd MMM', { locale: sv })}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end">
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

        <Card className="bg-gradient-to-br from-slate-800/60 to-slate-700/30 border-slate-700/40">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="shrink-0 p-2 rounded-xl bg-cyan-500/15">
              <Info className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-medium text-slate-300 mb-1">Hur används detta?</h3>
              <p className="text-sm sm:text-base text-slate-400">
                Informationen du skriver här inkluderas automatiskt i alla dina samtal med AI:n.
                Det hjälper AI:n att förstå din situation bättre och ge mer relevanta svar utan
                att du behöver upprepa samma kontext varje gång.
              </p>
            </div>
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
