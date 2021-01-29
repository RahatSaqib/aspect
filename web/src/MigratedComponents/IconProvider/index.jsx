import React, { Suspense, lazy, memo } from 'react'
import { string } from 'prop-types'
import classnames from 'classnames/bind'
import { FaSquare } from 'react-icons/fa'
import ErrorBoundary from '../ErrorBoundary'

const cssClasses = classnames.bind(require('./Icons.css'))

async function loadIconModule(icon) {
  const iconFamily = icon.substring(0, 2).toLowerCase()
  switch (true) {
    case iconFamily === 'fa':
      return import('react-icons/fa')

    default:
      return import('react-icons/md')
  }
}

/**
 * Icon component to dynamically import icon from string.
 * Falls back to default icon if failure
 */

const IconProvider = memo(({ icon, className }) => {
  const IconShell = ({ children }) => (
    <div className={cssClasses([className])}>{children}</div>
  )

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
        <IconShell>
          <FaSquare className={cssClasses(['icons__proxy'])} title="FaSquare" />
        </IconShell>
      }
    >
      <IconShell>
        <ErrorBoundary
          fallbackComponent={() => <IconProvider icon="FaQuestionCircle" />}
        >
          <IconComponent title={icon} />
        </ErrorBoundary>
      </IconShell>
    </Suspense>
  )
})

IconProvider.propTypes = {
  /**
    String of the icon name to be displayed
  */
  icon: string.isRequired,
  /**
    Class name for icon to be displayed
  */
  className: string.isRequired,
}

export default IconProvider
