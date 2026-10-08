import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

// False during SSR and hydration, true afterwards. Lets components render browser-only
// content without a hydration mismatch and without setting state in an effect.
export const useIsClient = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
