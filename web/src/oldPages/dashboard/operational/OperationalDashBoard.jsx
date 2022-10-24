import React, { Fragment } from 'react'
import classnames from 'classnames/bind'
import { useQuery } from 'react-query'
import ErrorBoundary from '../../../components/ErrorBoundary'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import ASSAY_LIST from '../../../components/QueryFetch/Assay/index'
import { useAuthState } from '../../../providers/AuthProvider'
import PermissionsProvider, { isGraphPermitted } from '../../../providers/PermissionsProvider'
import DeviceStatusGraph from '../Graphs/DeviceStatusGraph'
import InventoryStatusGraph from '../Graphs/InventoryStatusGraph'
import ResultTransmittedGraph from '../Graphs/ResultTransmittedGraph'
import SummaryStatus from '../status/SummaryStatus'
import styles from './OperationalData.css'

const cssClasses = classnames.bind(styles)

const OperationalDashBoard = () => {
  const auth = useAuthState()
  const isPermittedToFetchAssays = isGraphPermitted({ auth, permissions: ['assay'] })

  const {
    isError,
    data: { data: assays } = false,
    error,
  } = useQuery(ASSAY_LIST.KEY, async () => fetchWrapperForQueries({ endpoint: ASSAY_LIST.ENDPOINT }), {
    enabled: isPermittedToFetchAssays,
  })

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

      <PermissionsProvider permissions={['operationalData']}>
        <ResultTransmittedGraph />
        {assays ? (
          <>
            <DeviceStatusGraph assaysFromState={assays} />
            <InventoryStatusGraph assaysFromState={assays} />
          </>
        ) : null}
      </PermissionsProvider>
    </Fragment>
  )
}

export default OperationalDashBoard
