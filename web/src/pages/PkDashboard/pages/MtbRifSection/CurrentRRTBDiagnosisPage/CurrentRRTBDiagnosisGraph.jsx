import React, { useState } from 'react'
import { Switch, FormControlLabel, Grid } from '@mui/material'
import endOfMonth from 'date-fns/endOfMonth'
import parse from 'date-fns/parse'
import startOfMonth from 'date-fns/startOfMonth'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router'
import { StateSelect, LgaSelect } from '../../../../../cleanComponents'
import Loading from '../../../../../cleanComponents/Loading'
import SimpleBarGraph from '../../../../../components/Graphs/SimpleBarGraph/SimpleBarGraph'
import fetchWrapperForQueries from '../../../../../components/QueryFetch'
import useAssayList from '../../../../../hooks/assay/useAssayList'
import useI18n from '../../../../../hooks/useI18n'
import { graphMessages, getCustomMessage } from '../../../../../messages'
import { useAuthState } from '../../../../../providers/AuthProvider'
import { useFilterUpdate } from '../../../../../providers/FilterProvider'
import { objectToArray } from '../../../../../utils/utils/misc'
import PkPage from '../../../components/PkPage'
import TripleCardSide from '../../../components/TripleCardSide'
import messages from '../../../PkDashboard.Messages'

const resultFilters = {
  assay: ['GxMtbRif', 'GxMtbRifUltra'],
  resultCategoryGroupId: ['GxMtbRifMtbDetectedRifDetected', 'GxMtbRifUltraMtbDetectedRifDetected'],
}

const now = new Date()
const startOfYearUTC = new Date(Date.UTC(now.getFullYear()))
const endOfYearUTC = new Date(Date.UTC(now.getFullYear(), 11, 31, 23, 59, 59, 999))

const defaultFilters = [
  { assay: 'GxMtbRif' },
  { assay: 'GxMtbRifUltra' },
  { groupBy: 'month' },
  { minDate: startOfYearUTC },
  { maxDate: endOfYearUTC },
  { resultCategory1: 'Detected' },
  { resultCategory2: 'Detected' },
  { flags: 'GET_TOTAL_RESULTS_IN_CURRENT_YEAR' },
  { flags: 'GET_AVERAGE_RESULTS_PER_MONTH_CURRENT_YEAR' },
  { flags: 'GET_TOTAL_RESULTS_IN_LAST_24_HOURS' },
]

const CurrentDiagnosisGraphPage = () => {
  const { formatMessage } = useI18n()
  const user = useAuthState()
  const [showLabel, setShowLabel] = useState(true)
  const [filter, setFilter] = useState({})
  const { data: assays } = useAssayList()
  const { data, isLoading } = useQuery(
    ['testPerformedMonthlyPercentage', { endPointParams: objectToArray(filter).concat(defaultFilters) }],
    async ({ queryKey: [, { endPointParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/current-result-aggregations', params: endPointParams })
  )

  const navigate = useNavigate()
  const [addFilter] = useFilterUpdate()

  const goToResultsPage = ({ indexValue: yearMonth }) => {
    const date = parse(yearMonth, 'yyyy-MM', new Date())
    const baseUrl = '/browse/result'
    addFilter(
      {
        assayId: assays.filter(a => resultFilters.assay.includes(a.externalId)).map(a => a.id),
        minDate: startOfMonth(date),
        maxDate: endOfMonth(date),
        resultCategoryGroupId: resultFilters.resultCategoryGroupId,
        onlyReportableResults: true,
        displayResult: 'actual',
      },
      baseUrl
    )
    navigate(baseUrl)
  }

  return (
    <PkPage
      title={formatMessage(messages.rrtbDiagnosisTitle)}
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
            label={getCustomMessage(messages, 'selectPlaceholder', user, { entity: 'state' })}
          />
          <LgaSelect
            value={filter?.lgaId ?? ''}
            stateId={filter?.stateId}
            onChange={e => setFilter(prv => ({ ...prv, lgaId: e.target.value }))}
            label={getCustomMessage(messages, 'selectPlaceholder', user, { entity: 'lga' })}
          />
        </>
      }
    >
      {isLoading ? (
        <Loading />
      ) : (
        <Grid container sx={{ mt: 2 }}>
          <Grid item xs={12} md={8} lg={8}>
            <SimpleBarGraph
              data={data.data}
              keys={['cnt']}
              legends={[]}
              onClick={goToResultsPage}
              isInteractive={false}
              indexBy="month"
              enableLabel={showLabel}
            />
          </Grid>
          <TripleCardSide
            data={[
              { label: formatMessage(messages.RRPerYear), value: `${data.totalResultsCurrentYear}` },
              {
                label: formatMessage(messages.RRPerMonth),
                value: `${data.averageTestsPerMonthCurrentYear.toFixed(1)}`,
              },
              { label: formatMessage(messages.RRPerDay), value: `${data.totalResultsInLast24Hours}` },
            ]}
          />
        </Grid>
      )}
    </PkPage>
  )
}

export default CurrentDiagnosisGraphPage
