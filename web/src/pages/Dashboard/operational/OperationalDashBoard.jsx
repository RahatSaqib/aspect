import React, { Fragment } from 'react'
import { useQuery } from 'react-query'
import { ErrorBoundary, DeviceStatusGraph, ResultTransmittedGraph, InventoryStatusGraph } from '../../../components'
import LazyGraph from '../../../components/LazyGraph'
import PermissionChecker from '../../../components/PermissionChecker'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import ASSAY_LIST from '../../../components/QueryFetch/Assay/index'
import { SELECTS_QUERY_OPTIONS } from '../../../utils/consts/ReactQuery/CONSTS'
import SummaryStatus from '../status/SummaryStatus'
import styles from './OperationalData.module.css'

const OperationalDashBoard = () => {
  const {
    isError,
    data: { data: assays } = false,
    error,
  } = useQuery(ASSAY_LIST.KEY, async () => fetchWrapperForQueries({ endpoint: ASSAY_LIST.ENDPOINT }), {
    ...SELECTS_QUERY_OPTIONS,
  })

  if (isError) {
    throw new Error(error)
  }
  return (
    <Fragment>
      <PermissionChecker permissions={['operationalData']}>
        <ErrorBoundary>
          <SummaryStatus className={styles.Section__summary} dashboard="operational" />
        </ErrorBoundary>

        <LazyGraph>
          <ErrorBoundary>
            <ResultTransmittedGraph />
          </ErrorBoundary>
        </LazyGraph>
        {assays ? (
          <div className={styles.wrapper}>
            <LazyGraph>
              <ErrorBoundary>
                <DeviceStatusGraph assaysFromState={assays} />
              </ErrorBoundary>
            </LazyGraph>
            <LazyGraph>
              <ErrorBoundary>
                <InventoryStatusGraph assaysFromState={assays} />
              </ErrorBoundary>
            </LazyGraph>
          </div>
        ) : null}
      </PermissionChecker>
    </Fragment>
  )
}

export default OperationalDashBoard
