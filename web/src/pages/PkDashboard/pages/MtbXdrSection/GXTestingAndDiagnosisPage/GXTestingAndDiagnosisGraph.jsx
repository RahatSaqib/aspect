import React, { useEffect, useMemo, useState } from 'react'
import { FormControlLabel, Grid, MenuItem, Switch, TextField, Typography } from '@mui/material'
import format from 'date-fns/format'
import isNil from 'lodash/isNil'
import omitBy from 'lodash/omitBy'
import { useIntl } from 'react-intl'
import { useQuery } from 'react-query'
import { ColumnLineGraph, LgaSelect, Loading, StateSelect } from '../../../../../components'
import messages from '../../../../../components/Graphs/graphMessages'
import fetchWrapperForQueries from '../../../../../components/QueryFetch'
import useAuthState from '../../../../../hooks/useAuthState'
import { usePathFilter } from '../../../../../hooks/usePathFilter'
import { getCustomMessage, graphMessages, months } from '../../../../../messages'
import PkPage from '../../../components/PkPage'
import pkMessages from '../../../PkDashboard.Messages'

const now = new Date()

const endpointParams = [{ minDate: format(now, 'yyyy-01-01') }, { maxDate: format(now, 'yyyy-12-31') }]

const GXTestingAndDiagnosisGraph = () => {
  const { formatMessage } = useIntl()
  const user = useAuthState()
  const [showLabel, setShowLabel] = useState(true)
  const [filters, setFilters] = usePathFilter(undefined)
  const lineSource = useMemo(
    () => [formatMessage(messages.FQRPercent), formatMessage(messages.INHPercent)],
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
  const totalTestsMessage = formatMessage(messages.TotalTests)
  const FQRPercentMessage = formatMessage(messages.FQRPercent)
  const INHPercentMessage = formatMessage(messages.INHPercent)

  const [graphData, setGraphData] = useState()
  useEffect(() => {
    if (data) {
      const line = []
      const bar = []
      data.grouped.map(dat => {
        const { month, FqrToMtbPercentage, InhToMtbPercentage, TotalTests, MtbDetected, FqrDetected, InhDetected } = dat
        const monthStr = month.split('-')
        if (+monthStr[0] >= 2021) {
          const translatedDate = `${formatMessage(months[+monthStr[1] - 1])}-${monthStr[0]}`
          if (lineFor === FQRPercentMessage) {
            line.push({ month: translatedDate, [FQRPercentMessage]: +FqrToMtbPercentage.toFixed(1) })
          } else if (lineFor === INHPercentMessage) {
            line.push({ month: translatedDate, [INHPercentMessage]: +InhToMtbPercentage.toFixed(1) })
          }
          bar.push({ month: translatedDate, value: TotalTests, type: totalTestsMessage })
          bar.push({ month: translatedDate, value: MtbDetected, type: mtbDetectedMessage })
          bar.push({ month: translatedDate, value: FqrDetected, type: fqrDetectedMessage })
          bar.push({ month: translatedDate, value: InhDetected, type: inhDetectedMessage })
        }
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
      title={formatMessage(pkMessages.fqinhTestingDiagnosis)}
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
            onChange={e => setFilters({ stateId: e.target.value })}
            label={getCustomMessage(formatMessage, pkMessages, 'selectPlaceholder', user, { entity: 'state' })}
          />
          <LgaSelect
            value={filters?.lgaId ?? ''}
            stateId={filters?.stateId}
            onChange={e => setFilters(prv => ({ ...prv, lgaId: e.target.value }))}
            label={getCustomMessage(formatMessage, pkMessages, 'selectPlaceholder', user, { entity: 'lga' })}
          />
        </>
      }
    >
      <Grid container>
        <Grid item xs={12} md={12} lg={12}>
          <Typography sx={{ m: '10px' }} variant="h6" color="primary" component="div">
            {formatMessage(pkMessages[user.isCountry('PK') ? 'xdrFlqResistance' : 'xdrFLQAndINHTrends'])}
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
              { name: lineFor, colorId: 'casePercentDetectedOfTotal' },
            ]}
            xField="month"
            getCustomProps={({ geometryOptions: [column, line], ...rest }) => ({
              ...rest,
              geometryOptions: [{ ...column, label: false }, line],
            })}
            yField={['value', lineFor]}
          />
        </Grid>
      </Grid>
    </PkPage>
  )
}

export default GXTestingAndDiagnosisGraph
