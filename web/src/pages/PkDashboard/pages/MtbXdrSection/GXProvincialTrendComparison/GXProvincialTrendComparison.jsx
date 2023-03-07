import React, { useMemo, useState } from 'react'
import { Grid } from '@mui/material'
import StateAutocomplete from '../../../../../cleanComponents/StateAutocomplete'
import useI18n from '../../../../../hooks/useI18n'
import { getCustomMessage } from '../../../../../messages'
import { useAuthState } from '../../../../../providers/AuthProvider'
import GXTrendTable from '../../../components/GXTrendTable'
import PkPage from '../../../components/PkPage'
import messages from '../../../PkDashboard.Messages'

const mockedRows = [
  {
    province: 'Alabama',
    perYear: 159,
    monthlyAverage: 24,
    perDay: 6,
  },
  {
    province: 'Alaska',
    perYear: 237,
    monthlyAverage: 37,
    perDay: 9,
  },
  {
    province: 'California',
    perYear: 262,
    monthlyAverage: 24,
    perDay: 16,
  },
  {
    province: 'Colorado',
    perYear: 305,
    monthlyAverage: 67,
    perDay: 3.7,
  },
]

const GXProvincialTrendComparison = () => {
  const { formatMessage } = useI18n()
  const user = useAuthState()
  const [states, setState] = useState([])
  const rows = useMemo(
    () =>
      states.length
        ? mockedRows.filter(({ province }) => states.map(({ name }) => name).includes(province))
        : mockedRows,
    [states]
  )
  return (
    <PkPage
      title={`${formatMessage(messages.TbDProvincialComparison)}`}
      filters={
        <>
          <StateAutocomplete
            fullWidth
            countryId={user.countryId}
            value={states}
            onChange={(_, newValue) => setState(newValue)}
            label={getCustomMessage(messages, 'selectPlaceholder', user, { entity: 'state' })}
          />
        </>
      }
    >
      <Grid container sx={{ mt: 2 }}>
        <GXTrendTable rows={rows} />
      </Grid>
    </PkPage>
  )
}

export default GXProvincialTrendComparison
