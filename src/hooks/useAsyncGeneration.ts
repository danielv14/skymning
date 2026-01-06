import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'

type UseAsyncGenerationOptions<T> = {
  generateFn: () => Promise<T>
  onSuccess?: (result: T) => void
  fallbackValue?: T
  errorMessage?: string
  autoGenerate?: boolean
  shouldAutoGenerate?: boolean
}

type UseAsyncGenerationReturn<T> = {
  result: T | null
  isGenerating: boolean
  isRegenerating: boolean
  generate: () => Promise<void>
  regenerate: () => Promise<void>
  reset: () => void
  setResult: (value: T | null) => void
}

export const useAsyncGeneration = <T>({
  generateFn,
  onSuccess,
  fallbackValue,
  errorMessage = 'Något gick fel',
  autoGenerate = true,
  shouldAutoGenerate = true,
}: UseAsyncGenerationOptions<T>): UseAsyncGenerationReturn<T> => {
  const [result, setResult] = useState<T | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const hasGeneratedRef = useRef(false)

  const generateFnRef = useRef(generateFn)
  const onSuccessRef = useRef(onSuccess)
  const fallbackValueRef = useRef(fallbackValue)
  const errorMessageRef = useRef(errorMessage)

  useEffect(() => {
    generateFnRef.current = generateFn
    onSuccessRef.current = onSuccess
    fallbackValueRef.current = fallbackValue
    errorMessageRef.current = errorMessage
  })

  const generate = useCallback(async (isRegenerate = false) => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()

    if (isRegenerate) {
      setIsRegenerating(true)
    } else {
      setIsGenerating(true)
    }

    try {
      const generatedResult = await generateFnRef.current()
      if (abortControllerRef.current?.signal.aborted) return

      setResult(generatedResult)
      onSuccessRef.current?.(generatedResult)
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return

      console.error('Generation failed:', error)
      toast.error(errorMessageRef.current)

      if (fallbackValueRef.current !== undefined) {
        setResult(fallbackValueRef.current)
      }
    } finally {
      setIsGenerating(false)
      setIsRegenerating(false)
    }
  }, [])

  const regenerate = useCallback(() => generate(true), [generate])

  const reset = useCallback(() => {
    abortControllerRef.current?.abort()
    setResult(null)
    setIsGenerating(false)
    setIsRegenerating(false)
    hasGeneratedRef.current = false
  }, [])

  useEffect(() => {
    if (autoGenerate && shouldAutoGenerate && !hasGeneratedRef.current) {
      hasGeneratedRef.current = true
      generate()
    }
  }, [autoGenerate, shouldAutoGenerate, generate])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  return {
    result,
    isGenerating,
    isRegenerating,
    generate: () => generate(false),
    regenerate,
    reset,
    setResult,
  }
}
