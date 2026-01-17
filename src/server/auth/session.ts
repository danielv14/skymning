import { useSession } from '@tanstack/react-start/server'

type SessionData = {
  authenticated: boolean
}

export const useAppSession = () => {
  return useSession<SessionData>({
    name: 'skymning_session',
    password: process.env.SESSION_SECRET!,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60, // 30 dagar
    },
  })
}
