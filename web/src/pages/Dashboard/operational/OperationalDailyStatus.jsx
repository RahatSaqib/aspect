import React, { Fragment } from 'react'
import { ErrorBoundary } from '../../../components'
import DailyStatus from '../../../components/Graphs/DailyStatus'
import DailyStatusMap from '../../../components/Maps/DailyStatus'
import PermissionChecker from '../../../components/PermissionChecker'

const OperationalDailyStatus = () => {
  return (
    <Fragment>
      <PermissionChecker permissions={['operationalData']}>
        <ErrorBoundary>
          <DailyStatusMap />
        </ErrorBoundary>
      </PermissionChecker>

      <PermissionChecker permissions={['operationalData']}>
        <ErrorBoundary>
          <DailyStatus />
        </ErrorBoundary>
      </PermissionChecker>
    </Fragment>
  )
}

export default OperationalDailyStatus
