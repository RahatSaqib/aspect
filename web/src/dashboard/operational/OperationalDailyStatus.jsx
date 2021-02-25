/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react'

import PermissionsProvider from '../../Providers/PermissionsProvider'
import ErrorBoundary from '../../MigratedComponents/ErrorBoundary'
import DailyStatus from '../../MigratedComponents/Graphs/DailyStatus'
import DailyStatusMap from '../../MigratedComponents/Maps/DailyStatus'

export const OperationalDailyStatus = () => {
  return (
    <ErrorBoundary>
      <PermissionsProvider permissions={['operationalData']}>
        <DailyStatusMap />
      </PermissionsProvider>
      <PermissionsProvider permissions={['operationalData']}>
        <DailyStatus />
      </PermissionsProvider>
    </ErrorBoundary>
  )
}

export default OperationalDailyStatus
