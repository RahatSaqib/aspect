import React, { Suspense, lazy, memo } from 'react'
import PropTypes from 'prop-types'
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
          <FaSquare className={cssClasses(['icons__proxy'])} />
        </IconShell>
      }
    >
      <IconShell>
        <ErrorBoundary
          fallbackComponent={() => <IconProvider icon="FaQuestionCircle" />}
        >
          <IconComponent />
        </ErrorBoundary>
      </IconShell>
    </Suspense>
  )
})

IconProvider.propTypes = {
  icon: PropTypes.string.isRequired,
  className: PropTypes.string.isRequired,
}

export default IconProvider
