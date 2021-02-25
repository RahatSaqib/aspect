import React, { Fragment } from 'react'

import PermissionsProvider from '../../Providers/PermissionsProvider'
import ErrorBoundary from '../../MigratedComponents/ErrorBoundary'
import DailyStatus from '../../MigratedComponents/Graphs/DailyStatus'
import DailyStatusMap from '../../MigratedComponents/Maps/DailyStatus'

export const OperationalDailyStatus = () => {
  return (
    <Fragment>
      <ErrorBoundary>
        <PermissionsProvider permissions={['operationalData']}>
          <DailyStatusMap />
        </PermissionsProvider>
      </ErrorBoundary>
      <ErrorBoundary>
        <PermissionsProvider permissions={['operationalData']}>
          <DailyStatus />
        </PermissionsProvider>
      </ErrorBoundary>
    </Fragment>
  )
}

export default OperationalDailyStatus
