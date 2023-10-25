import React, { useState, useEffect } from 'react'
import { FormControlLabel, Grid, Switch, Typography } from '@mui/material'
import isNil from 'lodash/isNil'
import omitBy from 'lodash/omitBy'
import { useQuery } from 'react-query'
import { LgaSelect, StateSelect, Loading, ColumnLineGraph, getTimePeriod } from '../../../../../cleanComponents'
import messages from '../../../../../cleanComponents/Graphs/graphMessages'
import fetchWrapperForQueries from '../../../../../components/QueryFetch'
import useI18n from '../../../../../hooks/useI18n'
import { getCustomMessage, graphMessages } from '../../../../../messages'
import { useAuthState } from '../../../../../providers/AuthProvider'
import PkPage from '../../../components/PkPage'
import pkMessages from '../../../PkDashboard.Messages'

const endpointParams = [
  { minDate: getTimePeriod(12, 'months', 'yyyy-MM-dd') },
  { maxDate: getTimePeriod(0, 'day', 'yyyy-MM-dd') },
]

const GXTestingAndDiagnosisGraph = () => {
  const { formatMessage } = useI18n()
  const user = useAuthState()
  const [showLabel, setShowLabel] = useState(true)
  const [filter, setFilter] = useState(undefined)

  const mergedParams = filter
    ? [...endpointParams, ...Object.entries(omitBy(filter, isNil)).map(([name, value]) => ({ [name]: value }))]
    : [...endpointParams]

  const { isLoading, data } = useQuery(
    ['xdrAssayGraph', { mergedParams }],
    async ({ queryKey: [, { mergedParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/xdr-assay-graph', params: mergedParams })
  )

  const mtbDetectedMessage = formatMessage(messages.MtbDetected)
  const inhDetectedMessage = formatMessage(messages.InhDetected)
  const fqrDetectedMessage = formatMessage(messages.FqrDetected)
  const totalTestsMessage = formatMessage(messages.TotalTests)
  const FQRPercentMessage = formatMessage(messages.FQRPercent)

  const [graphData, setGraphData] = useState()
  useEffect(() => {
    if (data) {
      const line = []
      const bar = []
      data.grouped.map(({ month, FqrToMtbPercentage, TotalTests, MtbDetected, FqrDetected, InhDetected }) => {
        line.push({ month, [FQRPercentMessage]: +FqrToMtbPercentage.toFixed(2) })
        bar.push({ month, value: TotalTests, type: totalTestsMessage })
        bar.push({ month, value: MtbDetected, type: mtbDetectedMessage })
        bar.push({ month, value: FqrDetected, type: fqrDetectedMessage })
        bar.push({ month, value: InhDetected, type: inhDetectedMessage })
        return {}
      })

      setGraphData([bar, line])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  return isLoading ? (
    <Loading />
  ) : (
    <PkPage
      title={formatMessage(pkMessages.mtbXdrTestingDiagnosisTrends)}
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
            label={getCustomMessage(pkMessages, 'selectPlaceholder', user, { entity: 'state' })}
          />
          <LgaSelect
            value={filter?.lgaId ?? ''}
            stateId={filter?.stateId}
            onChange={e => setFilter(prv => ({ ...prv, lgaId: e.target.value }))}
            label={getCustomMessage(pkMessages, 'selectPlaceholder', user, { entity: 'lga' })}
          />
        </>
      }
    >
      <Grid container>
        <Grid item xs={12} md={12} lg={12}>
          <Typography sx={{ m: '10px' }} variant="h6" color="primary" component="div">
            {formatMessage(pkMessages.xdrFlqResistance)}
          </Typography>
          <ColumnLineGraph
            data={graphData}
            showLabel={showLabel}
            graphId="xdrAssayGraph"
            colors={[
              { name: totalTestsMessage, colorId: 'caseTotal' },
              { name: mtbDetectedMessage, colorId: '--aspect-color-slate' },
              { name: fqrDetectedMessage, colorId: 'caseDetected' },
              { name: inhDetectedMessage, colorId: 'casePercentDetectedOfTotal' },
              { name: FQRPercentMessage, colorId: 'casePercentDetectedOfTotal' },
            ]}
            xField="month"
            yField={['value', FQRPercentMessage]}
          />
        </Grid>
      </Grid>
    </PkPage>
  )
}

export default GXTestingAndDiagnosisGraph
