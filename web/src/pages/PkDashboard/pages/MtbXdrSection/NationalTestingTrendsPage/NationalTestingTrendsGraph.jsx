import React, { useState, useCallback } from 'react'
import { FormControlLabel, Grid, Switch } from '@mui/material'
import isNil from 'lodash/isNil'
import omitBy from 'lodash/omitBy'
import { LgaSelect, StateSelect } from '../../../../../cleanComponents'
import useAssayList from '../../../../../hooks/assay/useAssayList'
import useI18n from '../../../../../hooks/useI18n'
import { getCustomMessage, graphMessages } from '../../../../../messages'
import TrendInYearsAllTestsGraph from '../../../../../oldPages/dashboard/Graphs/TrendInYearsAllTestsGraph/TrendInYearsAllTestsGraph.Main'
import { useAuthState } from '../../../../../providers/AuthProvider'
import PkPage from '../../../components/PkPage'
import messages from '../../../PkDashboard.Messages'

const NationalTestingTrendsGraph = () => {
  const { formatMessage } = useI18n()
  const user = useAuthState()
  const [showLabel, setShowLabel] = useState(true)
  const [filter, setFilter] = useState({})
  const { data: assays } = useAssayList()

  const onChangeState = useCallback(
    e => setFilter(prev => ({ ...prev, stateId: e.target.value, lgaId: undefined })),
    []
  )
  const onChangeLga = useCallback(e => setFilter(prev => ({ ...prev, lgaId: e.target.value })), [])

  return (
    <PkPage
      title={`${formatMessage(messages.GXTbNationalTrend)} ${new Date().getFullYear()}`}
      filters={
        <>
          <FormControlLabel
            sx={{ minWidth: '145px' }}
            label={formatMessage(graphMessages.showValuesLabel)}
            control={<Switch checked={showLabel} onChange={e => setShowLabel(e.target.checked)} />}
          />
          <StateSelect
            countryId={user.countryId}
            onChange={onChangeState}
            label={getCustomMessage(messages, 'selectPlaceholder', user, { entity: 'state' })}
          />
          <LgaSelect
            stateId={filter.stateId}
            onChange={onChangeLga}
            label={getCustomMessage(messages, 'selectPlaceholder', user, { entity: 'lga' })}
          />
        </>
      }
    >
      <Grid container sx={{ mt: 2 }}>
        <TrendInYearsAllTestsGraph
          assaysFromState={assays}
          showLabel={showLabel}
          filterSelection={Object.entries(omitBy(filter, isNil)).map(([name, value]) => ({ [name]: value }))}
        />
      </Grid>
    </PkPage>
  )
}

export default NationalTestingTrendsGraph
