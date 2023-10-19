import React, { Fragment } from 'react'
import classnames from 'classnames/bind'
import { useQuery } from 'react-query'
import {
  ErrorBoundary,
  DeviceStatusGraph,
  ResultTransmittedGraph,
  InventoryStatusGraph,
} from '../../../cleanComponents'
import PermissionChecker from '../../../components/PermissionChecker'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import ASSAY_LIST from '../../../components/QueryFetch/Assay/index'
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
            <ErrorBoundary>
              <DeviceStatusGraph assaysFromState={assays} />
            </ErrorBoundary>
            <ErrorBoundary>
              <InventoryStatusGraph assaysFromState={assays} />
            </ErrorBoundary>
          </div>
        ) : null}
      </PermissionChecker>
    </Fragment>
  )
}

export default OperationalDashBoard
