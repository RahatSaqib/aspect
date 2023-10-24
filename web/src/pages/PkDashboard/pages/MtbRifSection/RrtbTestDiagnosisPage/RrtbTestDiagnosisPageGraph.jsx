import React, { useState, useEffect } from 'react'
import { Switch, FormControlLabel, Grid } from '@mui/material'
import { useQuery } from 'react-query'
import { StateSelect, LgaSelect, ColumnLineGraph, Loading, getTimePeriod } from '../../../../../cleanComponents'
import fetchWrapperForQueries from '../../../../../components/QueryFetch'
import useI18n from '../../../../../hooks/useI18n'
import { graphMessages, getCustomMessage } from '../../../../../messages'
import { useAuthState } from '../../../../../providers/AuthProvider'
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
  const { formatMessage } = useI18n()
  const user = useAuthState()
  const [showLabel, setShowLabel] = useState(true)
  const [stateId, setState] = useState()
  const [lgaId, setLga] = useState()

  const mergedParams = stateId ? [...endpointParams, { stateId, lgaId }] : [...endpointParams]

  const { isLoading, data } = useQuery(
    ['rrtbMtbDetectedQuarterlyTrends', { mergedParams }],
    async ({ queryKey: [, { mergedParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/tb-testing-diagnosis-trend', params: mergedParams })
  )

  const rrDetectedMessage = formatMessage(messages.rrDetected)
  const totalTestsMessage = formatMessage(messages.TbTotal)
  const RRToTbTotalPercentage = formatMessage(messages.RRToTbTotalPercentage)

  const [graphData, setGraphData] = useState()
  useEffect(() => {
    if (data) {
      const line = []
      const bar = []
      data.grouped.map(({ year, rrToTbTotalPercentage, tbTotal, rrDetected }) => {
        line.push({ year, [RRToTbTotalPercentage]: +rrToTbTotalPercentage.toFixed(2) })
        bar.push({ year, value: tbTotal, type: totalTestsMessage })
        bar.push({ year, value: rrDetected, type: rrDetectedMessage })
        return {}
      })

      setGraphData([bar, line])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  return (
    <PkPage
      title={formatMessage(messages.testingDiagnosisTrendsRR)}
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
            graphId="rrtbDetectedQuarterlyTrends"
            colors={[
              { name: totalTestsMessage, colorId: 'caseTotal' },
              { name: rrDetectedMessage, colorId: 'caseDetected' },
              { name: RRToTbTotalPercentage, colorId: 'casePercentDetectedOfTotal' },
            ]}
            xField="year"
            yField={['value', RRToTbTotalPercentage]}
          />
        </Grid>
      )}
    </PkPage>
  )
}

export default RrtbTestDiagnosisPage
