import { Link } from '@tanstack/react-router'
import { Moon, Lock, Sparkles } from 'lucide-react'
import { Button } from './ui/Button'
import { StarField } from './StarField'

export const Welcome = () => {
  return (
    <div className="min-h-screen bg-night relative flex items-center justify-center p-6 sm:p-8 overflow-hidden">
      <StarField starCount={80} className="bottom-1/4" />

      {/* Extra aurora glow for welcome page */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.1) 30%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      <div className="max-w-lg text-center space-y-10 sm:space-y-12 relative z-10 px-1 stagger-children">
        <div className="space-y-6">
          {/* Moon icon with glow */}
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/30 to-cyan-400/30 rounded-full blur-2xl scale-150" />
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 flex items-center justify-center animate-float shadow-2xl">
              <Moon className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-400" />
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
            <span className="text-gradient-aurora">Skymning</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 leading-relaxed max-w-md mx-auto">
            En plats för reflektion. Varje kväll kan du prata med en varm
            samtalspartner som hjälper dig sätta ord på hur dagen kändes.
          </p>
        </div>

        {/* Features */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-slate-400">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-500" />
            <span className="text-sm">Helt privat</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-500" />
            <span className="text-sm">AI-driven reflektion</span>
          </div>
        </div>

        <Link to="/reflect" viewTransition>
          <Button size="lg" glow className="text-lg px-10">
            Börja din första reflektion
          </Button>
        </Link>
      </div>
    </div>
  )
}
