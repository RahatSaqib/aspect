import React, { useState } from 'react'
import { Grid } from '@mui/material'
import { useIntl } from 'react-intl'
import { useQuery } from 'react-query'
import { objectToArray, Loading } from '../../../../../components'
import fetchWrapperForQueries from '../../../../../components/QueryFetch'
import useAuthState from '../../../../../hooks/useAuthState'
import { getCustomMessage } from '../../../../../messages'
import NestedTable from '../../../components/NestedTable'
import PkPage from '../../../components/PkPage'
import messages from '../../../PkDashboard.Messages'

const now = new Date()
const startOfYearUTC = new Date(Date.UTC(now.getFullYear()))
const endOfYearUTC = new Date(Date.UTC(now.getFullYear(), 11, 31, 23, 59, 59, 999))

const defaultFilters = [
  { assay: 'GxMtbRif' },
  { assay: 'GxMtbRifUltra' },
  { minDate: startOfYearUTC },
  { maxDate: endOfYearUTC },
]

const DeviceCoveragePage = () => {
  const { formatMessage } = useIntl()
  const [filter] = useState()

  const user = useAuthState()
  const stateName = getCustomMessage(formatMessage, messages, 'state', user, { entity: 'state' })

  const columns = [
    { key: 'Province/Region', name: stateName, prop: 'name' },
    { key: 'GX Sites', name: formatMessage(messages.gxSites), prop: 'cntSites' },
    { key: 'GX-6C Devices', name: formatMessage(messages.gx6CDevices), prop: 'cnt6cDevices' },
    { key: 'GX-10C Devices', name: formatMessage(messages.gx10CDevices), prop: 'cnt10cDevices' },
    {
      key: 'Combined GX-6C/GX-10C Devices',
      name: formatMessage(messages.combinedGX6CGX10CDevices),
      prop: 'cnt6c10cCombo',
    },
    { key: 'GX-6C Modules', name: formatMessage(messages.gx6CModules), prop: 'cnt6cModules' },
    { key: 'GX-10C Modules', name: formatMessage(messages.gx10CModules), prop: 'cnt10cModules' },
  ]

  const { data: { data } = {}, isLoading } = useQuery(
    ['DeviceCoveragePage', { endPointParams: objectToArray(filter ?? {}).concat(defaultFilters) }],
    async ({ queryKey: [, { endPointParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/device/coverage', params: endPointParams })
  )
  return (
    <PkPage title={formatMessage(messages.coverageTitle)}>
      {isLoading ? (
        <Loading />
      ) : (
        <Grid container sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <NestedTable columns={columns} rows={data} hasDetail allowPagination={false} />
          </Grid>
        </Grid>
      )}
    </PkPage>
  )
}

export default DeviceCoveragePage
