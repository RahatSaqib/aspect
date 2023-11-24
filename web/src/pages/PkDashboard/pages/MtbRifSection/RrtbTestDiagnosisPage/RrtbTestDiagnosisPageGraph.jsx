import React, { useState, useEffect } from 'react'
import { Switch, FormControlLabel, Grid } from '@mui/material'
import { useIntl } from 'react-intl'
import { useQuery } from 'react-query'
import { StateSelect, LgaSelect, ColumnLineGraph, Loading, getTimePeriod } from '../../../../../cleanComponents'
import fetchWrapperForQueries from '../../../../../components/QueryFetch'
import useAuthState from '../../../../../hooks/useAuthState'
import { graphMessages, getCustomMessage } from '../../../../../messages'
import PkPage from '../../../components/PkPage'
import messages from '../../../PkDashboard.Messages'
import intlMessages from '../../../../../cleanComponents/Graphs/graphMessages'

const endpointParams = [
  { source: 'tbAndRrDetection' },
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
  const [stateId, setState] = useState()
  const [lgaId, setLga] = useState()

  const mergedParams = stateId ? [...endpointParams, { stateId, lgaId }] : [...endpointParams]

  const { isLoading, data } = useQuery(
    ['rrtbMtbDetectedQuarterlyTrends', { mergedParams }],
    async ({ queryKey: [, { mergedParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/tb-testing-diagnosis-trend', params: mergedParams })
  )

  const mtbPlusMessage = formatMessage(intlMessages.MTBPlus)
  const mtbPlusTotalMessage = formatMessage(intlMessages.MTBPlus) + ' ' + formatMessage(intlMessages.Total)
  const mtbPlusPercentageMessage = formatMessage(intlMessages.MTBPercent)
  const rrDetectedMessage = formatMessage(messages.rrDetected)
  const rrTotalTestsMessage = formatMessage(messages.TbTotal)
  const rrToTbTotalPercentageMessage = formatMessage(messages.RRToTbTotalPercentage)

  const [graphData, setGraphData] = useState()
  useEffect(() => {
    if (data) {
      const line = []
      const bar = []
      data.grouped.map(({ year, MtbToTotalPercentage, Total, MtbDetected, rrToTbTotalPercentage, tbTotal, rrDetected }) => {
        line.push({ year, [mtbPlusPercentageMessage]: +MtbToTotalPercentage.toFixed(2) })
        bar.push({ year, value: MtbDetected, type: mtbPlusMessage })
        bar.push({ year, value: Total, type: mtbPlusTotalMessage })
        line.push({ year, [rrToTbTotalPercentageMessage]: +rrToTbTotalPercentage.toFixed(2) })
        bar.push({ year, value: tbTotal, type: rrTotalTestsMessage })
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
            label={getCustomMessage(formatMessage, messages, 'selectPlaceholder', user, { entity: 'state' })}
          />
          <LgaSelect
            stateId={stateId}
            onChange={e => setLga(e.target.value)}
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
              { name: mtbPlusMessage, colorId: 'caseDetected' },
              { name: mtbPlusTotalMessage, colorId: 'caseTotal' },
              { name: mtbPlusPercentageMessage, colorId: 'casePercentDetectedOfTotal' },
              { name: rrTotalTestsMessage, colorId: 'caseTotal' },
              { name: rrDetectedMessage, colorId: 'caseDetected' },
              { name: rrToTbTotalPercentageMessage, colorId: 'casePercentDetectedOfTotal' },
            ]}
            xField="year"
            yField={['value', rrToTbTotalPercentageMessage]}
          />
        </Grid>
      )}
    </PkPage>
  )
}

export default RrtbTestDiagnosisPage
