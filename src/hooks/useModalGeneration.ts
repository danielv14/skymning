import { useEffect, useRef } from 'react'

type UseModalGenerationOptions = {
  open: boolean
  shouldGenerate: boolean
  reset: () => void
  regenerate: () => void
}

export const useModalGeneration = ({
  open,
  shouldGenerate,
  reset,
  regenerate,
}: UseModalGenerationOptions) => {
  const prevOpenRef = useRef(false)

  useEffect(() => {
    const wasOpen = prevOpenRef.current
    prevOpenRef.current = open

    if (open && !wasOpen && shouldGenerate) {
      reset()
      regenerate()
    }
  }, [open, shouldGenerate, reset, regenerate])
}
