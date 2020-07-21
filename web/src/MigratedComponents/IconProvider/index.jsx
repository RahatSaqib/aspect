import React, { Suspense, lazy } from 'react'
import classnames from 'classnames/bind'
import CircularProgress from '@material-ui/core/CircularProgress'

const cssClasses = classnames.bind(require('./Icons.css'))

function IconProvider({ icon: IconName, iconClass }) {
  const IconComponent = lazy(() =>
    import('react-icons/md').then(module => {
      return { default: module[IconName] }
    })
  )
  return (
    <Suspense fallback={<CircularProgress />}>
      <div className={cssClasses([iconClass])}>
        <IconComponent />
      </div>
    </Suspense>
  )
}

export default IconProvider
