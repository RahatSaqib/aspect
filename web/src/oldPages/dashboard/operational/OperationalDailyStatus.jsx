import React, { Fragment } from 'react'

import PermissionsProvider from '../../../providers/PermissionsProvider'
import ErrorBoundary from '../../../components/ErrorBoundary'
import DailyStatus from '../../../components/Graphs/DailyStatus'
import DailyStatusMap from '../../../components/Maps/DailyStatus'

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
