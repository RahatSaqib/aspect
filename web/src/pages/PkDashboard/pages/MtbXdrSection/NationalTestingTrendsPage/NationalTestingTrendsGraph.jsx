import React, { useState, useCallback } from 'react'
import { FormControlLabel, Switch } from '@mui/material'
import { LgaSelect, StateSelect } from '../../../../../cleanComponents'
import useAssayList from '../../../../../hooks/assay/useAssayList'
import useI18n from '../../../../../hooks/useI18n'
import { getCustomMessage, graphMessages } from '../../../../../messages'
import TrendInYearsAllTestsGraph from '../../../../../oldPages/dashboard/Graphs/TrendInYearsAllTestsGraph/TrendInYearsAllTestsGraph.Main'
import { useAuthState } from '../../../../../providers/AuthProvider'
import { objectToArray } from '../../../../../utils/utils/misc'
import PkPage from '../../../components/PkPage'
import messages from '../../../PkDashboard.Messages'

const defaultFilters = [{ assay: 'GxMtbXdr' }]
const NationalTestingTrendsGraph = () => {
  const { formatMessage } = useI18n()
  const user = useAuthState()
  const [showLabel, setShowLabel] = useState(true)
  const [filter, setFilter] = useState({})
  const { data: assays } = useAssayList()

  const onChangeState = useCallback(e => setFilter({ stateId: e.target.value }), [])
  const onChangeLga = useCallback(e => setFilter(prev => ({ ...prev, lgaId: e.target.value })), [])

  return (
    <PkPage
      title={formatMessage(messages.nationalXdrTestingTrends)}
      filters={
        <>
          <FormControlLabel
            sx={{ minWidth: '145px' }}
            label={formatMessage(graphMessages.showValuesLabel)}
            control={<Switch checked={showLabel} onChange={e => setShowLabel(e.target.checked)} />}
          />
          <StateSelect
            value={filter.stateId ?? ''}
            countryId={user.countryId}
            onChange={onChangeState}
            label={getCustomMessage(messages, 'selectPlaceholder', user, { entity: 'state' })}
          />
          <LgaSelect
            value={filter.lgaId ?? ''}
            stateId={filter.stateId}
            onChange={onChangeLga}
            label={getCustomMessage(messages, 'selectPlaceholder', user, { entity: 'lga' })}
          />
        </>
      }
    >
      <TrendInYearsAllTestsGraph
        assaysFromState={assays ?? []}
        showLabel={showLabel}
        yearTitle={formatMessage(messages.annualTestingTrends)}
        monthTitle={formatMessage(messages.monthlyTestingTrends)}
        filterSelection={objectToArray(filter).concat(defaultFilters)}
      />
    </PkPage>
  )
}

export default NationalTestingTrendsGraph
