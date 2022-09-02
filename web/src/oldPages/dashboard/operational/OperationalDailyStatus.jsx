import React, { Fragment } from 'react'
import ErrorBoundary from '../../../components/ErrorBoundary'
import DailyStatus from '../../../components/Graphs/DailyStatus'
import DailyStatusMap from '../../../components/Maps/DailyStatus'
import PermissionsProvider from '../../../providers/PermissionsProvider'

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
