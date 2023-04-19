import React, { Fragment } from 'react'
import classnames from 'classnames/bind'
import { useQuery } from 'react-query'
import ErrorBoundary from '../../../cleanComponents/ErrorBoundary'
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
      <PermissionChecker permissions={['operationalData']}>
        <ErrorBoundary>
          <SummaryStatus className={cssClasses('Section--summary')} dashboard="operational" />
        </ErrorBoundary>
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
