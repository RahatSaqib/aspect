import React, { useState, useEffect, useMemo } from 'react'
import { FormControlLabel, Grid, Switch, Typography, MenuItem, TextField } from '@mui/material'
import isNil from 'lodash/isNil'
import omitBy from 'lodash/omitBy'
import { useIntl } from 'react-intl'
import { useQuery } from 'react-query'
import { LgaSelect, StateSelect, Loading, ColumnLineGraph, getTimePeriod } from '../../../../../components'
import messages from '../../../../../components/Graphs/graphMessages'
import fetchWrapperForQueries from '../../../../../components/QueryFetch'
import useAuthState from '../../../../../hooks/useAuthState'
import { usePathFilter } from '../../../../../hooks/usePathFilter'
import { getCustomMessage, graphMessages } from '../../../../../messages'
import PkPage from '../../../components/PkPage'
import pkMessages from '../../../PkDashboard.Messages'

const endpointParams = [
  { minDate: getTimePeriod(12, 'months', 'yyyy-MM-dd') },
  { maxDate: getTimePeriod(0, 'day', 'yyyy-MM-dd') },
]

const DataVisualisationForXDRResistance = () => {
  const { formatMessage } = useIntl()
  const user = useAuthState()
  const [showLabel, setShowLabel] = useState(true)
  const [filters, setFilter] = usePathFilter(undefined)
  const lineSource = useMemo(
    () => [
      formatMessage(messages.FQRPercent),
      formatMessage(messages.INHPercent),
      formatMessage(messages.AMKPercent),
      formatMessage(messages.KANPercent),
      formatMessage(messages.CAPPercent),
      formatMessage(messages.ETHPercent),
    ],
    [formatMessage]
  )
  const [lineFor, setLineFor] = useState(lineSource[0])

  const mergedParams = filters
    ? [...endpointParams, ...Object.entries(omitBy(filters, isNil)).map(([name, value]) => ({ [name]: value }))]
    : [...endpointParams]

  const { isLoading, data } = useQuery(
    ['xdrAssayGraph', { mergedParams }],
    async ({ queryKey: [, { mergedParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/xdr-assay-graph', params: mergedParams })
  )

  const mtbDetectedMessage = formatMessage(messages.MtbDetected)
  const inhDetectedMessage = formatMessage(messages.InhDetected)
  const fqrDetectedMessage = formatMessage(messages.FqrDetected)
  const amkDetectedMessage = formatMessage(messages.AmkDetected)
  const kanDetectedMessage = formatMessage(messages.KanDetected)
  const capDetectedMessage = formatMessage(messages.CapDetected)
  const ethDetectedMessage = formatMessage(messages.EthDetected)
  const totalTestsMessage = formatMessage(messages.TotalTests)
  const FQRPercentMessage = formatMessage(messages.FQRPercent)
  const INHPercentMessage = formatMessage(messages.INHPercent)
  const AMKPercentMessage = formatMessage(messages.AMKPercent)
  const KANPercentMessage = formatMessage(messages.KANPercent)
  const CAPPercentMessage = formatMessage(messages.CAPPercent)
  const ETHPercentMessage = formatMessage(messages.ETHPercent)

  const [graphData, setGraphData] = useState()
  useEffect(() => {
    if (data) {
      const line = []
      const bar = []
      data.grouped.map(dat => {
        const {
          month,
          FqrToMtbPercentage,
          InhToMtbPercentage,
          KanToMtbPercentage,
          EthToMtbPercentage,
          CapToMtbPercentage,
          AmkToMtbPercentage,
          TotalTests,
          MtbDetected,
          FqrDetected,
          InhDetected,
          AmkDetected,
          KanDetected,
          CapDetected,
          EthDetected,
        } = dat

        if (lineFor === FQRPercentMessage) {
          line.push({ month, [FQRPercentMessage]: +FqrToMtbPercentage.toFixed(1) })
        } else if (lineFor === INHPercentMessage) {
          line.push({ month, [INHPercentMessage]: +InhToMtbPercentage.toFixed(1) })
        } else if (lineFor === AMKPercentMessage) {
          line.push({ month, [AMKPercentMessage]: +AmkToMtbPercentage.toFixed(1) })
        } else if (lineFor === KANPercentMessage) {
          line.push({ month, [KANPercentMessage]: +KanToMtbPercentage.toFixed(1) })
        } else if (lineFor === CAPPercentMessage) {
          line.push({ month, [CAPPercentMessage]: +CapToMtbPercentage.toFixed(1) })
        } else if (lineFor === ETHPercentMessage) {
          line.push({ month, [ETHPercentMessage]: +EthToMtbPercentage.toFixed(1) })
        }

        bar.push({ month, value: TotalTests, type: totalTestsMessage })
        bar.push({ month, value: MtbDetected, type: mtbDetectedMessage })
        bar.push({ month, value: FqrDetected, type: fqrDetectedMessage })
        bar.push({ month, value: InhDetected, type: inhDetectedMessage })
        bar.push({ month, value: AmkDetected, type: amkDetectedMessage })
        bar.push({ month, value: KanDetected, type: kanDetectedMessage })
        bar.push({ month, value: CapDetected, type: capDetectedMessage })
        bar.push({ month, value: EthDetected, type: ethDetectedMessage })
        return {}
      })

      setGraphData([bar, line])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, lineFor])

  return isLoading ? (
    <Loading />
  ) : (
    <PkPage
      title={formatMessage(pkMessages.dataVisualisationForXDR)}
      filters={
        <>
          <FormControlLabel
            sx={{ minWidth: '145px' }}
            label={formatMessage(graphMessages.showValuesLabel)}
            control={<Switch checked={showLabel} onChange={e => setShowLabel(e.target.checked)} />}
          />
          <TextField
            label={formatMessage(pkMessages.showLineFor)}
            select
            value={lineFor}
            onChange={e => setLineFor(e.target.value)}
            SelectProps={{ IconComponent: () => null }}
          >
            {lineSource.map(it => (
              <MenuItem key={it} value={it}>
                {it}
              </MenuItem>
            ))}
          </TextField>
          <StateSelect
            value={filters?.stateId ?? ''}
            countryId={user.countryId}
            onChange={e => setFilter({ stateId: e.target.value })}
            label={getCustomMessage(formatMessage, pkMessages, 'selectPlaceholder', user, { entity: 'state' })}
          />
          <LgaSelect
            value={filters?.lgaId ?? ''}
            stateId={filters?.stateId}
            onChange={e => setFilter(prv => ({ ...prv, lgaId: e.target.value }))}
            label={getCustomMessage(formatMessage, pkMessages, 'selectPlaceholder', user, { entity: 'lga' })}
          />
        </>
      }
    >
      <Grid container>
        <Grid item xs={12} md={12} lg={12}>
          <Typography sx={{ m: '10px' }} variant="h6" color="primary" component="div">
            {formatMessage(pkMessages[user.isCountry('PK') ? 'xdrFlqResistance' : 'xdrDrugResistance'])}
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
              { name: amkDetectedMessage, colorId: '2010' },
              { name: kanDetectedMessage, colorId: '2017' },
              { name: capDetectedMessage, colorId: '2018' },
              { name: ethDetectedMessage, colorId: '2013' },
              { name: lineFor, colorId: '2014' },
            ]}
            xField="month"
            yField={['value', lineFor]}
            getCustomProps={({ geometryOptions: [column, line], ...rest }) => ({
              ...rest,
              geometryOptions: [{ ...column, label: false }, line],
            })}
          />
        </Grid>
      </Grid>
    </PkPage>
  )
}

export default DataVisualisationForXDRResistance
