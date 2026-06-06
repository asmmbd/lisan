'use client'

import { useEffect, useRef, type RefObject } from 'react'

interface UseInfiniteScrollOptions {
  /** Whether more pages are available */
  hasMore: boolean
  /** Whether a load is currently in flight */
  isLoading: boolean
  /** Fired when the sentinel becomes visible */
  onLoadMore: () => void
  /** Optional root margin for the IntersectionObserver */
  rootMargin?: string
  /** Optional ref to the scrollable container (default: viewport) */
  root?: RefObject<Element | null> | null
  /** Disable the observer (e.g. SSR or feature off) */
  enabled?: boolean
}

/**
 * Lightweight infinite-scroll hook. Attach the returned ref to a sentinel
 * element placed at the end of the list and `onLoadMore` fires when the
 * sentinel intersects the viewport.
 */
export function useInfiniteScroll<T extends Element = HTMLDivElement>(
  options: UseInfiniteScrollOptions
): RefObject<T | null> {
  const { hasMore, isLoading, onLoadMore, rootMargin, root, enabled = true } = options
  const sentinelRef = useRef<T | null>(null)
  // Hold the latest callback in a ref to avoid re-creating the observer
  // every render while still allowing the consumer to capture fresh state.
  const callbackRef = useRef(onLoadMore)
  callbackRef.current = onLoadMore

  useEffect(() => {
    if (!enabled) return
    if (!hasMore || isLoading) return
    const node = sentinelRef.current
    if (!node) return
    if (typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting) {
          callbackRef.current()
        }
      },
      {
        root: root?.current ?? null,
        rootMargin: rootMargin ?? '200px',
      }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [enabled, hasMore, isLoading, root, rootMargin])

  return sentinelRef
}
