import React, { useState } from 'react'
import { Grid } from '@mui/material'
import { useQuery } from 'react-query'
import { objectToArray, Loading } from '../../../../../cleanComponents'
import fetchWrapperForQueries from '../../../../../components/QueryFetch'
import useI18n from '../../../../../hooks/useI18n'
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

const columns = [
  { name: 'Province/Region', prop: 'name' },
  { name: 'GX Sites', prop: 'cntSites' },
  { name: 'GX-6C Devices', prop: 'cnt6cDevices' },
  { name: 'GX-10C Devices', prop: 'cnt10cDevices' },
  { name: 'Combined GX-6C/GX-10C Devices', prop: 'cnt6c10cCombo' },
  { name: 'GX-6C Modules', prop: 'cnt6cModules' },
  { name: 'GX-10C Modules', prop: 'cnt10cModules' },
]

const DeviceCoveragePage = () => {
  const { formatMessage } = useI18n()
  const [filter] = useState()

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
            <NestedTable columns={columns} rows={data} hasDetail />
          </Grid>
        </Grid>
      )}
    </PkPage>
  )
}

export default DeviceCoveragePage
