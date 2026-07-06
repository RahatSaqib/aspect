import { useEffect, useRef, useState } from 'react'

/**
 * Hook to detect when an element becomes visible in the viewport.
 * Useful for lazy-loading components (e.g., graphs, charts) to improve initial load performance.
 *
 * @param {Object} options - IntersectionObserver options
 * @param {string} options.threshold - When to trigger (0-1, default 0.1)
 * @param {string} options.rootMargin - Margin around viewport (default '0px', can use '100px' to preload)
 * @returns {Object} { ref, isVisible } - attach ref to element, isVisible is true when element is in viewport
 */
const useIntersectionObserver = ({ threshold = 0.1, rootMargin = '0px' } = {}) => {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          // Once visible, stop observing to avoid re-renders
          observer.unobserve(entry.target)
        }
      },
      { threshold, rootMargin }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
      observer.disconnect()
    }
  }, [threshold, rootMargin])

  return { ref, isVisible }
}

export default useIntersectionObserver
