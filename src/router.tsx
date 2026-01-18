import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export const getRouter = () => {
  const router = createRouter({
    routeTree,
    context: {},

    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultViewTransition: {
      types: ({ toLocation }) => {
        // Disable view transitions when navigating to /reflect to ensure
        // the component fully remounts and useChat picks up initialMessages
        if (toLocation.pathname === '/reflect') {
          return []
        }
        return ['default']
      },
    },
  })

  return router
}
