import React from 'react'
import useIntersectionObserver from '../hooks/useIntersectionObserver'

/**
 * Lazy-load wrapper for dashboard graphs.
 * Only renders the graph when it becomes visible in the viewport.
 * Shows a placeholder (fixed-size container) while waiting to be scrolled into view.
 *
 * @param {React.ReactNode} children - The graph component to lazy-load
 * @param {Object} options - IntersectionObserver options (threshold, rootMargin)
 */
const LazyGraph = ({ children, options }) => {
  const { ref, isVisible } = useIntersectionObserver(options)

  return (
    <div
      ref={ref}
      style={{
        minHeight: '500px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      {isVisible ? children : null}
    </div>
  )
}

export default LazyGraph
