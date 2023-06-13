import React, { useState } from 'react'
import { FormControlLabel, Grid, Switch } from '@mui/material'
import { LgaSelect, StateSelect } from '../../../../../cleanComponents'
import useAssayList from '../../../../../hooks/assay/useAssayList'
import useI18n from '../../../../../hooks/useI18n'
import { getCustomMessage, graphMessages } from '../../../../../messages'
import XDRFLQResistanceGraphMain from '../../../../../oldPages/dashboard/Graphs/XDRFLQResistanceGraph/XDRFLQResistanceGraph.Main'
import { useAuthState } from '../../../../../providers/AuthProvider'
import PkPage from '../../../components/PkPage'
import messages from '../../../PkDashboard.Messages'

const GXTestingAndDiagnosisGraph = () => {
  const { formatMessage } = useI18n()
  const user = useAuthState()
  const [showLabel, setShowLabel] = useState(true)
  const [filter] = useState(undefined)
  const [state, setState] = useState()
  const [, setLga] = useState()
  const { data: assays } = useAssayList()

  return (
    <PkPage
      title={formatMessage(messages.mtbXdrTestingDiagnosisTrends)}
      filters={
        <>
          <FormControlLabel
            sx={{ minWidth: '145px' }}
            label={formatMessage(graphMessages.showValuesLabel)}
            control={<Switch checked={showLabel} onChange={e => setShowLabel(e.target.checked)} />}
          />
          <StateSelect
            countryId={user.countryId}
            onChange={e => setState(e.target.value)}
            label={getCustomMessage(messages, 'selectPlaceholder', user, { entity: 'state' })}
          />
          <LgaSelect
            stateId={state}
            onChange={e => setLga(e.target.value)}
            label={getCustomMessage(messages, 'selectPlaceholder', user, { entity: 'lga' })}
          />
        </>
      }
    >
      <Grid container>
        <XDRFLQResistanceGraphMain assaysFromState={assays} showLabel={showLabel} filterSelection={filter} />
      </Grid>
    </PkPage>
  )
}

export default GXTestingAndDiagnosisGraph
