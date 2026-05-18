import React, { useState, useEffect } from 'react'
import { Switch, FormControlLabel, Grid } from '@mui/material'
import { useIntl } from 'react-intl'
import { useQuery } from 'react-query'
import { StateSelect, LgaSelect, ColumnLineGraph, Loading, objectToArray } from '../../../../../components'
import intlMessages from '../../../../../components/Graphs/graphMessages'
import { getTimePeriod } from '../../../../../components/Graphs/Helpers/Formatters'
import fetchWrapperForQueries from '../../../../../components/QueryFetch'
import useAuthState from '../../../../../hooks/useAuthState'
import { usePathFilter } from '../../../../../hooks/usePathFilter'
import { graphMessages, getCustomMessage } from '../../../../../messages'
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

  const mtbPlusMessage = formatMessage(intlMessages.MtbDetected)
  const totalMessage = formatMessage(intlMessages.Total)
  const percentageMessage = formatMessage(intlMessages.MTBPercent)

  const [graphData, setGraphData] = useState()
  useEffect(() => {
    if (data) {
      const line = []
      const bar = []
      data.grouped
        .filter(g => g.year >= 2022)
        .slice(-5)
        .map(({ year, MtbToTotalPercentage, Total, MtbDetected }) => {
          line.push({ year, [percentageMessage]: +MtbToTotalPercentage.toFixed(1) })
          bar.push({ year, value: Total, type: totalMessage })
          bar.push({ year, value: MtbDetected, type: mtbPlusMessage })
          return {}
        })
      setGraphData([bar, line])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  return (
    <PkPage
      title={formatMessage(
        user.isPakistan ? messages.XDRTestingandDiagnosisTrends : messages.xdrTestingAndMtbDetectionTrends
      )}
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
                showLabel={showLabel}
              />
            </Grid>
          </Grid>
        </Grid>
      )}
    </PkPage>
  )
}

export default XDRTestingDiagnosisTrendPage
