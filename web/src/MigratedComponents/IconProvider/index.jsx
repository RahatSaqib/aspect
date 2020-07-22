import React, { Suspense, lazy } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import CircularProgress from '@material-ui/core/CircularProgress'
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

function IconProvider({ icon, className }) {
  const IconComponent = lazy(() =>
    loadIconModule(icon).then(module => {
      if (module && module[icon]) {
        return { default: module[icon] }
      }
      throw new Error(`${icon} does not exist!`)
    })
  )
  return (
    <Suspense fallback={<CircularProgress />}>
      <div className={cssClasses([className])}>
        <ErrorBoundary>
          <IconComponent />
        </ErrorBoundary>
      </div>
    </Suspense>
  )
}

IconProvider.propTypes = {
  icon: PropTypes.string.isRequired,
  className: PropTypes.string.isRequired,
}

export default IconProvider
