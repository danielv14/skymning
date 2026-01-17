import { useState, FormEvent } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { loginFn } from '../server/functions/auth'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

const LoginPage = () => {
  const [secret, setSecret] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await loginFn({ data: { secret } })

      if (result.success) {
        navigate({ to: '/' })
      } else {
        setError(result.error || 'Något gick fel')
      }
    } catch {
      setError('Kunde inte ansluta till servern')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-100 mb-2">Skymning</h1>
            <p className="text-slate-400">Ange lösenord för att fortsätta</p>
          </div>

          <div>
            <input
              type="password"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              placeholder="Lösenord"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <Button
            type="submit"
            disabled={isLoading || !secret}
            className="w-full"
          >
            {isLoading ? 'Loggar in...' : 'Logga in'}
          </Button>
        </form>
      </Card>
    </div>
  )
}

export const Route = createFileRoute('/login')({
  head: () => ({
    meta: [{ title: 'Logga in - Skymning' }],
  }),
  component: LoginPage,
})
