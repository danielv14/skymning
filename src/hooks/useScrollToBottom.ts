import { useEffect, useRef } from 'react'

// Keeps a chat scrolled to the newest message: jumps instantly on the first render with
// messages (restored history) and scrolls smoothly for every message after that.
export const useScrollToBottom = <TContainer extends HTMLElement>(messages: readonly unknown[]) => {
  const containerRef = useRef<TContainer>(null)
  const hasScrolledOnMount = useRef(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container || messages.length === 0) return

    if (!hasScrolledOnMount.current) {
      hasScrolledOnMount.current = true
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight
      })
      return
    }

    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
  }, [messages])

  return containerRef
}
