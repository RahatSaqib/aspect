import React, { useState, useEffect } from 'react'
import { Switch, FormControlLabel, Grid } from '@mui/material'
import { useIntl } from 'react-intl'
import { useQuery } from 'react-query'
import {
  StateSelect,
  LgaSelect,
  ColumnLineGraph,
  Loading,
  getTimePeriod,
  objectToArray,
} from '../../../../../components'
import intlMessages from '../../../../../components/Graphs/graphMessages'
import fetchWrapperForQueries from '../../../../../components/QueryFetch'
import useAuthState from '../../../../../hooks/useAuthState'
import { usePathFilter } from '../../../../../hooks/usePathFilter'
import { graphMessages, getCustomMessage } from '../../../../../messages'
import allmessages from '../../../../../messages/allMessages'
import PkPage from '../../../components/PkPage'
import messages from '../../../PkDashboard.Messages'

const endpointParams = [
  { source: 'rrDetection' },
  { assay: 'GxMtbRif' },
  { assay: 'GxMtbRifUltra' },
  { groupBy: 'resultCategory1' },
  { groupBy: 'resultCategory2' },
  { minDate: getTimePeriod(5, 'years', 'yyyy-MM-dd') }, // five years ago
  { maxDate: getTimePeriod(0, 'day', 'yyyy-MM-dd') },
]

const RrtbTestDiagnosisPage = () => {
  const { formatMessage } = useIntl()
  const user = useAuthState()
  const [showLabel, setShowLabel] = useState(true)
  const [filters, setFilter] = usePathFilter()

  const mergedParams = filters ? [...endpointParams, ...objectToArray(filters)] : [...endpointParams]

  const { isLoading, data } = useQuery(
    ['rrtbMtbDetectedQuarterlyTrends', { mergedParams }],
    async ({ queryKey: [, { mergedParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/tb-testing-diagnosis-trend', params: mergedParams })
  )

  const testsPerformedMessage = formatMessage(allmessages.Total)
  const rrDetectedMessage = formatMessage(messages.rrDetected)
  const mtbDetectedMessage = formatMessage(intlMessages.MTBPlus)
  const rrToMtbPercentageMessage = formatMessage(messages.rrToMtbPercentage)

  const [graphData, setGraphData] = useState()
  useEffect(() => {
    if (data) {
      const line = []
      const bar = []
      data.grouped.slice(-5).map(({ year, testsPerformed, mtbDetected, rrDetected, rrToMtbPercentage }) => {
        bar.push({ year, value: testsPerformed, type: testsPerformedMessage })
        bar.push({ year, value: mtbDetected, type: mtbDetectedMessage })
        bar.push({ year, value: rrDetected, type: rrDetectedMessage })
        line.push({ year, [rrToMtbPercentageMessage]: +rrToMtbPercentage.toFixed(2) })
        return {}
      })

      setGraphData([bar, line])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])
  return (
    <PkPage
      title={formatMessage(messages.RRTestingDiagnosis)}
      filters={
        <>
          <FormControlLabel
            sx={{ minWidth: '145px' }}
            label={formatMessage(graphMessages.showValuesLabel)}
            control={<Switch checked={showLabel} onChange={e => setShowLabel(e.target.checked)} />}
          />
          <StateSelect
            countryId={user.countryId}
            value={filters?.stateId ?? ''}
            onChange={e => setFilter({ stateId: e.target.value })}
            label={getCustomMessage(formatMessage, messages, 'selectPlaceholder', user, { entity: 'state' })}
          />
          <LgaSelect
            stateId={filters?.stateId}
            value={filters?.lgaId ?? ''}
            onChange={e => setFilter(prv => ({ ...prv, lgaId: e.target.value }))}
            label={getCustomMessage(formatMessage, messages, 'selectPlaceholder', user, { entity: 'lga' })}
          />
        </>
      }
    >
      {isLoading ? (
        <Loading />
      ) : (
        <Grid item xs={12}>
          <ColumnLineGraph
            data={graphData}
            showLabel={showLabel}
            graphId="rrtbDetectedQuarterlyTrends"
            colors={[
              { name: testsPerformedMessage, colorId: 'caseTotal' },
              { name: mtbDetectedMessage, colorId: 'casePercentDetectedOfTotal' },
              { name: rrDetectedMessage, colorId: 'caseDetected' },
              { name: rrToMtbPercentageMessage, colorId: 'caseDetected' },
            ]}
            xField="year"
            yField={['value', rrToMtbPercentageMessage]}
          />
        </Grid>
      )}
    </PkPage>
  )
}

export default RrtbTestDiagnosisPage
