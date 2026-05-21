import React, { Suspense, lazy, memo } from 'react'
import { bool, string, oneOfType } from 'prop-types'
import { FaSquare } from 'react-icons/fa'
import { ErrorBoundary } from '..'
import styles from './Icons.module.css'

async function loadIconModule(icon) {
  const iconFamily = icon.substring(0, 2).toLowerCase()
  switch (true) {
    case iconFamily === 'fa':
      return import('react-icons/fa')

    case iconFamily === 'ai':
      return import('react-icons/ai')

    case iconFamily === 'bs':
      return import('react-icons/bs')
    case iconFamily === 'gr':
      return import('react-icons/gr')

    default:
      return import('react-icons/md')
  }
}

/**
 * Icon component to dynamically import icon from string.
 * Falls back to default icon if failure
 */

const IconProvider = memo(({ icon, className = '', title }) => {
  const IconComponent = lazy(() =>
    loadIconModule(icon).then(module => {
      if (module && module[icon]) {
        return { default: module[icon] }
      }
      throw new Error(`${icon} does not exist!`)
    })
  )

  return (
    <Suspense
      fallback={
        <div className={className}>
          <FaSquare className={styles.icons__proxy} />
        </div>
      }
    >
      <div className={className}>
        <ErrorBoundary fallbackComponent={() => <IconProvider icon="FaQuestionCircle" />}>
          <IconComponent title={title} />
        </ErrorBoundary>
      </div>
    </Suspense>
  )
})

IconProvider.defaultProps = {
  className: null,
  title: true,
}

IconProvider.propTypes = {
  /**
    String of the icon name to be displayed
  */
  icon: string.isRequired,
  /**
    Class name for icon to be displayed
  */
  className: string,
  /**
    Class name for icon to be displayed
  */
  title: oneOfType([bool, string]),
}

export default IconProvider
