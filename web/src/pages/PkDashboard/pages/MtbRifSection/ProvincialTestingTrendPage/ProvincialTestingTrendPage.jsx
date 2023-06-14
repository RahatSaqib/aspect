import React, { useMemo, useState } from 'react'
import { Grid } from '@mui/material'
import random from 'lodash/random'
import StateAutocomplete from '../../../../../cleanComponents/StateAutocomplete'
import SimpleBarLine from '../../../../../components/Graphs/SimpleBarLine'
import useI18n from '../../../../../hooks/useI18n'
import { getCustomMessage } from '../../../../../messages'
import { useAuthState } from '../../../../../providers/AuthProvider'
import PkPage from '../../../components/PkPage'
import ProvinceTrendTable from '../../../components/ProvinceTrendTable'
import messages from '../../../PkDashboard.Messages'

function generate() {
  return ['Alabama', 'Alaska', 'California', 'Colorado'].map(i => ({
    province: i,
    perYear: random(100, 200),
    monthlyAverage: random(10, 100),
    perDay: random(1, 10),
    trends: ['2020', '2001', '2022', '2023'].map(year => ({
      x: year,
      y: random(1000, 10000),
    })),
  }))
}

const data = generate()

const ProvincialTestingTrendPage = () => {
  const { formatMessage } = useI18n()
  const user = useAuthState()
  const [states, setState] = useState([])
  const items = useMemo(
    () => (states.length ? data.filter(({ province }) => states.map(({ name }) => name).includes(province)) : data),
    [states]
  )

  return (
    <PkPage
      isMocked
      title={`${formatMessage(messages.TbProvincialComparison)}`}
      filters={
        <StateAutocomplete
          fullWidth
          countryId={user.countryId}
          value={states}
          onChange={(_, newValue) => setState(newValue)}
          label={getCustomMessage(messages, 'selectPlaceholder', user, { entity: 'state' })}
        />
      }
    >
      <Grid container sx={{ mt: 2 }}>
        <Grid item xs={12} md={8} lg={8} sx={{ p: 1 }} container>
          <SimpleBarLine data={items?.map(({ province, trends }) => ({ id: province, data: trends }))} />
        </Grid>
        <Grid item xs={12} md={4} lg={4} container>
          <ProvinceTrendTable rows={items} />
        </Grid>
      </Grid>
    </PkPage>
  )
}

export default ProvincialTestingTrendPage
