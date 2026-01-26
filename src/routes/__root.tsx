import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { Toaster } from 'sonner'

import appCss from '../styles.css?url'

const RootComponent = () => {
  return (
    <html lang="sv">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-slate-950 text-stone-100 font-sans">
        <Outlet />
        <Toaster
          position="bottom-right"
          richColors
          toastOptions={{
            style: {
              background: '#0f172a',
              border: '1px solid #1e3a4a',
              color: '#f1f5f9',
            },
          }}
        />
        <Scripts />
      </body>
    </html>
  )
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Skymning',
      },
      {
        name: 'description',
        content: 'Din dagliga reflektion',
      },
    ],
    links: [
      {
        rel: 'icon',
        href: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌙</text></svg>',
      },
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap',
      },
    ],
  }),
  component: RootComponent,
})
