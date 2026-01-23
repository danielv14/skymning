import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-950">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-white mb-2">Sidan hittades inte</h1>
      <a href="/" className="text-emerald-400 hover:text-emerald-300">
        Gå till startsidan
      </a>
    </div>
  </div>
)

export const getRouter = () => {
  const router = createRouter({
    routeTree,
    context: {},
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: NotFound,
  })

  return router
}
