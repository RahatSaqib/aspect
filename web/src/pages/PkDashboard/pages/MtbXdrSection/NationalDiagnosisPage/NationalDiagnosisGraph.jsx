import React, { useState } from 'react'
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

const defaultFilters = [{ assay: 'GxMtbXdr' }, { resultCategory1: 'Detected' }]
const NationalDiagnosisGraph = () => {
  const { formatMessage } = useI18n()
  const user = useAuthState()
  const [showLabel, setShowLabel] = useState(true)
  const [filter, setFilter] = useState(undefined)
  const { data: assays } = useAssayList()

  return (
    <PkPage
      title={formatMessage(messages.nationalMtbXdrDiagnosed)}
      filters={
        <>
          <FormControlLabel
            sx={{ minWidth: '145px' }}
            label={formatMessage(graphMessages.showValuesLabel)}
            control={<Switch checked={showLabel} onChange={e => setShowLabel(e.target.checked)} />}
          />
          <StateSelect
            value={filter?.stateId ?? ''}
            countryId={user.countryId}
            onChange={e => setFilter({ stateId: e.target.value })}
            label={getCustomMessage(messages, 'selectPlaceholder', user, { entity: 'state' })}
          />
          <LgaSelect
            value={filter?.lgaId ?? ''}
            stateId={filter?.stateId}
            onChange={e => setFilter(prv => ({ ...prv, lgaId: e.target.value }))}
            label={getCustomMessage(messages, 'selectPlaceholder', user, { entity: 'lga' })}
          />
        </>
      }
    >
      <TrendInYearsAllTestsGraph
        withAnnual
        yearTitle={formatMessage(messages.annualMTBDiagnosedTrends)}
        monthTitle={formatMessage(messages.monthlyMTBDiagnosedTrends)}
        assaysFromState={assays ?? []}
        showLabel={showLabel}
        filterSelection={objectToArray(filter).concat(defaultFilters)}
      />
    </PkPage>
  )
}

export default NationalDiagnosisGraph
