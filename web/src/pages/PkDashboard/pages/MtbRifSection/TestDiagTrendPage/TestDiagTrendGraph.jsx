import React, { useState, useEffect } from 'react'
import { Switch, FormControlLabel, Grid } from '@mui/material'
import { useQuery } from 'react-query'
import { StateSelect, LgaSelect, Loading, ColumnLineGraph, getTimePeriod } from '../../../../../cleanComponents'
import intlMessages from '../../../../../cleanComponents/Graphs/graphMessages'
import fetchWrapperForQueries from '../../../../../components/QueryFetch'
import useI18n from '../../../../../hooks/useI18n'
import { graphMessages, getCustomMessage } from '../../../../../messages'
import { useAuthState } from '../../../../../providers/AuthProvider'
import PkPage from '../../../components/PkPage'
import messages from '../../../PkDashboard.Messages'

const endpointParams = [
  { source: 'tbDetection' },
  { assay: 'GxMtbRif' },
  { assay: 'GxMtbRifUltra' },
  { groupBy: 'resultCategory1' },
  { minDate: getTimePeriod(5, 'years', 'yyyy-MM-dd') }, // five years ago
  { maxDate: getTimePeriod(0, 'day', 'yyyy-MM-dd') },
]

const TestDiagTrendPage = () => {
  const { formatMessage } = useI18n()
  const user = useAuthState()
  const [showLabel, setShowLabel] = useState(true)
  const [stateId, setState] = useState()
  const [lgaId, setLga] = useState()

  const mergedParams = stateId ? [...endpointParams, { stateId, lgaId }] : [...endpointParams]

  const { isLoading, data } = useQuery(
    ['tbMtbDetectedQuarterlyTrends', { mergedParams }],
    async ({ queryKey: [, { mergedParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/tb-testing-diagnosis-trend', params: mergedParams })
  )

  const MTBPlusMessage = formatMessage(intlMessages.MTBPlus)
  const TotalMessage = formatMessage(intlMessages.Total)
  const MTBPercentMessage = formatMessage(intlMessages.MTBPercent)

  const [graphData, setGraphData] = useState()
  useEffect(() => {
    if (data) {
      const line = []
      const bar = []
      data.grouped.map(({ year, MtbToTotalPercentage, Total, MtbDetected }) => {
        line.push({ year, [MTBPercentMessage]: +MtbToTotalPercentage.toFixed(2) })
        bar.push({ year, value: Total, type: TotalMessage })
        bar.push({ year, value: MtbDetected, type: MTBPlusMessage })
        return {}
      })

      setGraphData([bar, line])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  return (
    <PkPage
      title={formatMessage(messages.mtbRifTestingDiagnosed)}
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
            stateId={stateId}
            onChange={e => setLga(e.target.value)}
            label={getCustomMessage(messages, 'selectPlaceholder', user, { entity: 'lga' })}
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
            graphId="tbMtbDetectedQuarterlyTrends"
            colors={[
              { name: TotalMessage, colorId: 'caseTotal' },
              { name: MTBPlusMessage, colorId: 'caseDetected' },
              { name: MTBPercentMessage, colorId: 'casePercentDetectedOfTotal' },
            ]}
            xField="year"
            yField={['value', MTBPercentMessage]}
          />
        </Grid>
      )}
    </PkPage>
  )
}

export default TestDiagTrendPage
