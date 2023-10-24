import React, { useState, useEffect } from 'react'
import { Switch, FormControlLabel, Grid } from '@mui/material'
import { useQuery } from 'react-query'
import { StateSelect, LgaSelect, ColumnLineGraph, Loading } from '../../../../../cleanComponents'
import intlMessages from '../../../../../cleanComponents/Graphs/graphMessages'
import { getTimePeriod } from '../../../../../components/Graphs/Helpers/Formatters'
import fetchWrapperForQueries from '../../../../../components/QueryFetch'
import useI18n from '../../../../../hooks/useI18n'
import { graphMessages, getCustomMessage } from '../../../../../messages'
import { useAuthState } from '../../../../../providers/AuthProvider'
import PkPage from '../../../components/PkPage'
import messages from '../../../PkDashboard.Messages'

const endpointParams = [
  { source: 'tbDetection' },
  { assay: 'GxMtbXdr' },
  { groupBy: 'resultCategory1' },
  { minDate: getTimePeriod(5, 'years', 'yyyy-MM-dd') }, // five years ago
  { maxDate: getTimePeriod(0, 'day', 'yyyy-MM-dd') },
]

const XDRTestingDiagnosisTrendPage = () => {
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

  const mtbPlusMessage = formatMessage(intlMessages.MtbDetected)
  const totalMessage = formatMessage(intlMessages.Total)
  const percentageMessage = formatMessage(intlMessages.MTBPercent)

  const [graphData, setGraphData] = useState()
  useEffect(() => {
    if (data) {
      const line = []
      const bar = []
      data.grouped.map(({ year, MtbToTotalPercentage, Total, MtbDetected }) => {
        line.push({ year, [percentageMessage]: +MtbToTotalPercentage.toFixed(2) })
        bar.push({ year, value: MtbDetected, type: mtbPlusMessage })
        bar.push({ year, value: Total, type: totalMessage })
        return {}
      })
      setGraphData([bar, line])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  return (
    <PkPage
      title={formatMessage(messages.testingAndDiagnosisUsingXdr)}
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
          <Grid container>
            <Grid item xs={12} md={12} lg={12}>
              <ColumnLineGraph
                data={graphData}
                graphId="tbMtbDetectedQuarterlyTrends"
                colors={[
                  { name: mtbPlusMessage, colorId: 'caseDetected' },
                  { name: totalMessage, colorId: 'caseTotal' },
                  { name: percentageMessage, colorId: 'casePercentDetectedOfTotal' },
                ]}
                xField="year"
                yField={['value', percentageMessage]}
              />
            </Grid>
          </Grid>
        </Grid>
      )}
    </PkPage>
  )
}

export default XDRTestingDiagnosisTrendPage
