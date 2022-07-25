import React, { Fragment } from 'react'
import classnames from 'classnames/bind'

import { useQuery } from 'react-query'

import SummaryStatus from '../status/SummaryStatus'

import PermissionsProvider from '../../Providers/PermissionsProvider'
import fetchWrapperForQueries from '../../MigratedComponents/QueryFetch'
import ErrorBoundary from '../../MigratedComponents/ErrorBoundary'
import GraphsContainer from '../../MigratedComponents/Graphs/GraphsContainer'
import deviceStatusGraphs from '../../MigratedComponents/Graphs/GraphConfigurations/DeviceStatus'
import resultsTransmittedGraphs from '../../MigratedComponents/Graphs/GraphConfigurations/ResultsTransmitted'
import inventoryStatusGraphs from '../../MigratedComponents/Graphs/GraphConfigurations/Inventory'

import ASSAY_LIST from '../../MigratedComponents/QueryFetch/Assay/index'

import styles from './OperationalData.css'

const cssClasses = classnames.bind(styles)

const OperationalDashBoard = () => {
  const { deviceStatus } = deviceStatusGraphs()
  const { resultsTransmitted } = resultsTransmittedGraphs()
  const { inventoryStatus } = inventoryStatusGraphs

  const {
    isError,
    data: { data: assays } = false,
    error,
  } = useQuery(ASSAY_LIST.KEY, async () => fetchWrapperForQueries({ endpoint: ASSAY_LIST.ENDPOINT }))

  if (isError) {
    throw new Error(error)
  }
  return (
    <Fragment>
      <ErrorBoundary>
        <PermissionsProvider permissions={['operationalData']}>
          <SummaryStatus className={cssClasses('Section--summary')} dashboard="operational" />
        </PermissionsProvider>
      </ErrorBoundary>

      <ErrorBoundary>
        <PermissionsProvider permissions={resultsTransmitted.graphRenderPermissions}>
          {assays && assays.length ? <GraphsContainer assaysFromState={assays} config={resultsTransmitted} /> : null}
        </PermissionsProvider>
      </ErrorBoundary>

      <ErrorBoundary>
        <PermissionsProvider permissions={deviceStatus.graphRenderPermissions}>
          <GraphsContainer assaysFromState={[]} config={deviceStatus} />
        </PermissionsProvider>
      </ErrorBoundary>

      <ErrorBoundary>
        <PermissionsProvider permissions={inventoryStatus.graphRenderPermissions}>
          <GraphsContainer assaysFromState={assays} config={inventoryStatus} />
        </PermissionsProvider>
      </ErrorBoundary>
    </Fragment>
  )
}

export default OperationalDashBoard
