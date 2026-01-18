import { Link } from '@tanstack/react-router'
import { Button } from './ui/Button'
import { StarField } from './StarField'

export const Welcome = () => {
  return (
    <div className="min-h-screen bg-night relative flex items-center justify-center p-6 sm:p-8">
      <StarField starCount={50} className="bottom-1/2" />
      <div className="max-w-md text-center space-y-8 sm:space-y-10 relative z-10 px-1 stagger-children">
        <div className="space-y-5">
          <div className="text-6xl sm:text-7xl mb-6 sm:mb-8 animate-float">🌙</div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            Välkommen till Skymning
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 leading-relaxed">
            En plats för reflektion. Varje kväll kan du prata med en varm
            samtalspartner som hjälper dig sätta ord på hur dagen kändes.
          </p>
        </div>

        <div className="space-y-2 text-slate-400">
          <p>Inga konton. Ingen synkronisering.</p>
          <p>Din dagbok stannar på din dator.</p>
        </div>

        <Link to="/reflect">
          <Button size="lg" glow>Börja din första reflektion</Button>
        </Link>
      </div>
    </div>
  )
}
