import React, { Fragment } from 'react'
import classnames from 'classnames/bind'
import { useQuery } from 'react-query'
import ErrorBoundary from '../../../components/ErrorBoundary'
import PermissionChecker from '../../../components/PermissionChecker'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import ASSAY_LIST from '../../../components/QueryFetch/Assay/index'
import DeviceStatusGraph from '../Graphs/DeviceStatusGraph'
import InventoryStatusGraph from '../Graphs/InventoryStatusGraph'
import ResultTransmittedGraph from '../Graphs/ResultTransmittedGraph'
import SummaryStatus from '../status/SummaryStatus'
import styles from './OperationalData.css'

const cssClasses = classnames.bind(styles)

const OperationalDashBoard = () => {
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
        <PermissionChecker permissions={['operationalData']}>
          <SummaryStatus className={cssClasses('Section--summary')} dashboard="operational" />
        </PermissionChecker>
      </ErrorBoundary>

      <PermissionChecker permissions={['operationalData']}>
        <ResultTransmittedGraph />
        {assays ? (
          <div className={cssClasses('wrapper')}>
            <DeviceStatusGraph assaysFromState={assays} />
            <InventoryStatusGraph assaysFromState={assays} />
          </div>
        ) : null}
      </PermissionChecker>
    </Fragment>
  )
}

export default OperationalDashBoard
