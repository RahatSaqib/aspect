import React, { Fragment } from 'react'
import ErrorBoundary from '../../../components/ErrorBoundary'
import DailyStatus from '../../../components/Graphs/DailyStatus'
import DailyStatusMap from '../../../components/Maps/DailyStatus'
import PermissionChecker from '../../../components/PermissionChecker'

export const OperationalDailyStatus = () => {
  return (
    <Fragment>
      <ErrorBoundary>
        <PermissionChecker permissions={['operationalData']}>
          <DailyStatusMap />
        </PermissionChecker>
      </ErrorBoundary>
      <ErrorBoundary>
        <PermissionChecker permissions={['operationalData']}>
          <DailyStatus />
        </PermissionChecker>
      </ErrorBoundary>
    </Fragment>
  )
}

export default OperationalDailyStatus
