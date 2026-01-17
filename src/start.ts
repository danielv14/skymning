import { createStart } from '@tanstack/react-start'
import { authMiddleware } from './server/middleware/auth'

export const startInstance = createStart(() => {
  return {
    functionMiddleware: [authMiddleware],
  }
})
