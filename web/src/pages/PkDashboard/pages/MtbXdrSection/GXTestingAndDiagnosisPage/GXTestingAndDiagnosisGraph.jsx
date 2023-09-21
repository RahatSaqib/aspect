import React, { useState } from 'react'
import { FormControlLabel, Grid, Switch } from '@mui/material'
import isNil from 'lodash/isNil'
import omitBy from 'lodash/omitBy'
import { LgaSelect, StateSelect } from '../../../../../cleanComponents'
import useAssayList from '../../../../../hooks/assay/useAssayList'
import useI18n from '../../../../../hooks/useI18n'
import { getCustomMessage, graphMessages } from '../../../../../messages'
import { useAuthState } from '../../../../../providers/AuthProvider'
import PkPage from '../../../components/PkPage'
import XDRFLQResistanceGraphMain from '../../../components/XDRFLQResistanceGraph.Main'
import messages from '../../../PkDashboard.Messages'

const GXTestingAndDiagnosisGraph = () => {
  const { formatMessage } = useI18n()
  const user = useAuthState()
  const [showLabel, setShowLabel] = useState(true)
  const [filter, setFilter] = useState(undefined)
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
      <Grid container>
        <XDRFLQResistanceGraphMain
          title={formatMessage(messages.xdrFlqResistance)}
          assaysFromState={assays ?? []}
          showLabel={showLabel}
          filterSelection={Object.entries(omitBy(filter, isNil)).map(([name, value]) => ({ [name]: value }))}
        />
      </Grid>
    </PkPage>
  )
}

export default GXTestingAndDiagnosisGraph
