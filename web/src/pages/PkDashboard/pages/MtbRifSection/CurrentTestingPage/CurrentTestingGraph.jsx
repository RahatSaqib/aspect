import React, { useState, useEffect } from 'react'
import { Switch, FormControlLabel, Grid } from '@mui/material'
import { useQuery } from 'react-query'
import { StateSelect, LgaSelect } from '../../../../../cleanComponents'
import { getTimePeriod } from '../../../../../components/Graphs/Helpers/Formatters'
import Loading from '../../../../../components/Loading'
import fetchWrapperForQueries from '../../../../../components/QueryFetch'
import useAssayList from '../../../../../hooks/assay/useAssayList'
import useI18n from '../../../../../hooks/useI18n'
import { graphMessages, getCustomMessage } from '../../../../../messages'
import TestsOverTimeGraphMain from '../../../../../oldPages/dashboard/Graphs/TestsOverTimeGraph/TestsOverTimeGraph.Main'
import { useAuthState } from '../../../../../providers/AuthProvider'
import PkPage from '../../../components/PkPage'
import TripleCardSide from '../../../components/TripleCardSide'
import messages from '../../../PkDashboard.Messages'

const endPointParams = [
  { groupBy: 'month' },
  { groupBy: 'assay' },
  { minDate: getTimePeriod(12, 'months', 'yyyy-MM-dd') },
  { maxDate: getTimePeriod(0, 'day', 'yyyy-MM-dd') },
]

const RifCurrentGraphPage = () => {
  const { formatMessage } = useI18n()
  const user = useAuthState()
  const [showLabel, setShowLabel] = useState(true)
  const [filter, setFilter] = useState([])
  const [state, setState] = useState()
  const [, setLga] = useState()
  const { data: assays } = useAssayList()

  useEffect(() => {
    if (assays) {
      const tbAssays = assays.filter(a => a.assayTypeAbbreviation === 'TB')
      const defaultFilter = tbAssays.length > 0 ? tbAssays : assays
      setFilter(defaultFilter)
    }
  }, [assays])

  const { data, isLoading } = useQuery(
    ['testPerformedMonthlyPercentage', { endPointParams }],
    async ({ queryKey: [, { endPointParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/clinical-indicator-aggregations', params: endPointParams })
  )

  return (
    <PkPage
      title={`${formatMessage(messages.rifCurrentTitle)} ${new Date().getFullYear()}`}
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
      {isLoading ? (
        <Loading />
      ) : (
        <Grid container sx={{ mt: 2 }}>
          <TestsOverTimeGraphMain
            data={data.data}
            endPointParams={endPointParams}
            assaysFromState={assays}
            showLabel={showLabel}
            filterSelection={filter}
          />
          <TripleCardSide
            data={[
              { label: formatMessage(messages.testPerYear), value: 123 },
              { label: formatMessage(messages.testPerMonth), value: 456 },
              { label: formatMessage(messages.testPerDay), value: 799 },
            ]}
          />
        </Grid>
      )}
    </PkPage>
  )
}

export default RifCurrentGraphPage
