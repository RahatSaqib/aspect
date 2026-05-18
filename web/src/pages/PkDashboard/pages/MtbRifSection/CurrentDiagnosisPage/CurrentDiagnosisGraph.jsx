import React, { useEffect, useRef, useState } from 'react'
import { FormControlLabel, Grid, Switch, Typography } from '@mui/material'
import format from 'date-fns/format'
import reduce from 'lodash/reduce'
import { useIntl } from 'react-intl'
import { useNavigate } from 'react-router-dom'
import {
  ColumnGraph,
  DonutGraph,
  formatDataByGraphType,
  genLabel,
  LgaSelect,
  Loading,
  negateTimeZoneOffset,
  objectToArray,
  StateSelect,
} from '../../../../../components'
import intlMessages from '../../../../../components/Graphs/graphMessages'
import {
  getMinMaxDateFromMonthString,
  getResultCategoryGroupsForResultList,
} from '../../../../../components/Graphs/graphUtils'
import useAssayList from '../../../../../hooks/assay/useAssayList'
import useResultCategoryGroup from '../../../../../hooks/result/useResultCategoryGroup'
import useAuthState from '../../../../../hooks/useAuthState'
import useFilterUpdate from '../../../../../hooks/useFilterUpdate'
import { usePathFilter } from '../../../../../hooks/usePathFilter'
import { getCustomMessage, graphMessages } from '../../../../../messages'
import PkPage from '../../../components/PkPage'
import TripleCardSide from '../../../components/TripleCardSide'
import { useMtpRifResults } from '../../../hooks/useMtpRifResults'
import messages from '../../../PkDashboard.Messages'

const now = new Date()
/**
 * Do not use below startOfYearUTC and endOfYearUTC, because after datetime preparation
 * for logged-in user in TZ +03:00 and current country in TZ +06:00 the fetch payload
 * will have dates like this
 *   minDate: '2024-01-01T03:00:00.000+06:00',
 *   maxDate: '2025-01-01T02:59:59.999+06:00',
 */
// const startOfYearUTC = new Date(Date.UTC(now.getFullYear()))
// const endOfYearUTC = new Date(Date.UTC(now.getFullYear(), 11, 31, 23, 59, 59, 999))
// const minDate = startOfYearUTC
// const maxDate = endOfYearUTC
/**
 * To resolve such over-engineered date preparation for this report let's use simple
 * way and format to 'yyyy-01-01' and 'yyyy-12-31'.
 * This will produce
 *    minDate: 2024-01-01T00:00:00.000+06:00
 *    maxDate: 2024-12-31T23:59:59.999+06:00
 * for fetching, and on API from this dates we can cut first 10 characters for using in queries
 */
const minDate = format(now, 'yyyy-01-01')
const maxDate = format(now, 'yyyy-12-31')

const defaultFilters = [
  { assay: 'GxMtbRif' },
  { assay: 'GxMtbRifUltra' },
  { groupBy: 'month' },
  { groupBy: 'assay' },
  { resultCategory1: 'Detected' },
  { resultCategory1: 'Trace Detected' },
  { minDate },
  { maxDate },
  { flags: 'GET_TOTAL_RESULTS_IN_CURRENT_YEAR' },
  { flags: 'GET_AVERAGE_RESULTS_PER_MONTH_CURRENT_YEAR' },
  { flags: 'GET_TOTAL_RESULTS_FOR_TODAY' },
]

const pieGraphParams = [{ groupBy: 'resultCategory1' }, { minDate }, { maxDate }, { flags: 'GET_TOTAL_RESULTS' }]

const CurrentDiagnosisGraphPage = () => {
  const { formatMessage, format } = useIntl()
  const user = useAuthState()
  const [showLabel, setShowLabel] = useState(true)
  const [showPercentage, setShowPercentage] = useState(false)
  const { data: assays, isLoading: isLoadingAssays } = useAssayList()
  const scopedAssays = assays?.filter(x => x.externalId === 'GxMtbRif' || x.externalId === 'GxMtbRifUltra')
  const { data: resultCategoryGroups, isLoading: isLoadingResultCategoryGroups } = useResultCategoryGroup(
    scopedAssays?.map(x => x.id)
  )

  const [filters, setFilter] = usePathFilter()
  const [addFilter] = useFilterUpdate()
  const navigate = useNavigate()
  const filterRef = useRef()

  useEffect(() => {
    filterRef.current = filters
  }, [filters])
  const { data: mainData, isLoading: isLoadingMain } = useMtpRifResults(objectToArray(filters).concat(defaultFilters))
  const { data: pieData, isLoading: isLoadingPie } = useMtpRifResults(objectToArray(filters).concat(pieGraphParams))

  const [donutData, setDonutData] = useState({})
  const [barData, setBarData] = useState({})
  useEffect(() => {
    if (mainData && assays) {
      const info = mainData.data.map(r =>
        r.assay ? r : { ...r, assay: 'GxMtbRif', assayI18nKey: 'assayGeneXpertMtbRif' }
      )

      const i18nKeys = reduce(
        info,
        (acc, curr) => {
          acc[curr.assay] = curr.assayI18nKey
          return acc
        },
        {}
      )
      const groupedForBar = formatDataByGraphType(
        info,
        'actual',
        false,
        'MMM',
        'month',
        'assay',
        i18nKeys,
        'bar',
        undefined,
        formatMessage,
        intlMessages
      )
      const currentYear = new Date().getFullYear()
      const expandedBarData = []
      groupedForBar.map(result => {
        const allKeysButMonth = Object.keys(result).filter(key => key !== 'month')
        allKeysButMonth.map(key => {
          if (+result.month.split('-')[0] === currentYear) {
            expandedBarData.push({
              id: key,
              month:
                formatMessage(messages[format(negateTimeZoneOffset(new Date(result.month)), 'MMM').toLowerCase()]) +
                format(negateTimeZoneOffset(new Date(result.month)), '-yyyy'),
              value: +result[key].toFixed(3).slice(0, -1),
              type: genLabel(key, assays, formatMessage, intlMessages, i18nKeys),
              originalMonth: result.month,
            })
          }
          return {}
        })
        return result
      })

      setBarData({ data: expandedBarData })
    }
    if (pieData) {
      const pieTotal = pieData.data.reduce((acc, curr) => acc + curr.cnt, 0)
      const pie = pieData.data.map(d => ({
        ...d,
        id: d.resultCategory1,
        label: formatMessage(intlMessages[d.resultCategory1I18nKey]),
        value: d.cnt,
      }))
      setDonutData({ data: pie, total: pieTotal })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainData, pieData, assays])

  return (
    <PkPage
      title={formatMessage(messages.TbDCurrent)}
      filters={
        <>
          <FormControlLabel
            sx={{ minWidth: '145px' }}
            label={formatMessage(graphMessages.showValuesLabel)}
            control={<Switch checked={showLabel} onChange={e => setShowLabel(e.target.checked)} />}
          />
          <FormControlLabel
            sx={{ minWidth: '145px' }}
            label={formatMessage(graphMessages.showPercentage)}
            control={<Switch checked={showPercentage} onChange={e => setShowPercentage(e.target.checked)} />}
          />
          <StateSelect
            value={filters?.stateId || ''}
            countryId={user.countryId}
            onChange={e => setFilter({ stateId: e.target.value })}
            label={getCustomMessage(formatMessage, messages, 'selectPlaceholder', user, { entity: 'state' })}
          />
          <LgaSelect
            value={filters?.lgaId || ''}
            stateId={filters?.stateId}
            onChange={e => setFilter(prv => ({ ...prv, lgaId: e.target.value }))}
            label={getCustomMessage(formatMessage, messages, 'selectPlaceholder', user, { entity: 'lga' })}
          />
        </>
      }
    >
      {isLoadingMain || isLoadingPie || isLoadingAssays || isLoadingResultCategoryGroups ? (
        <Loading />
      ) : (
        <Grid container sx={{ mt: 2 }}>
          {barData.data && barData.data.length ? (
            <Grid item xs={12} md={8}>
              <Typography sx={{ m: '10px' }} variant="h6" color="primary" component="div">
                {formatMessage(messages[user.isCountry('PK') ? 'testsPerformedYear' : 'mtbPositiveCurrentYear'])}
              </Typography>
              <ColumnGraph
                data={barData.data}
                graphId="testPerformedMonthlyPercentage"
                xField="month"
                yField="value"
                seriesField="type"
                showLabel={showLabel}
                onReady={plot => {
                  plot.on('plot:click', evt => {
                    const { minDate, maxDate } = getMinMaxDateFromMonthString(evt.data.data.originalMonth)
                    const assayIds = [assays.find(a => a.externalId === evt.data.data.id).id]
                    const resultCategoryGroupId = getResultCategoryGroupsForResultList(resultCategoryGroups, assayIds, [
                      'Detected',
                      'Trace Detected',
                    ])
                    const baseUrl = '/browse/result'
                    addFilter(
                      {
                        ...filterRef.current,
                        countryId: user.countryId,
                        displayResult: 'actual',
                        minDate,
                        maxDate,
                        assayId: assayIds,
                        resultCategoryGroupId,
                      },
                      baseUrl
                    )
                    navigate(baseUrl)
                  })
                }}
              />
            </Grid>
          ) : null}
          <TripleCardSide
            data={[
              { label: formatMessage(messages.xdrTBCasesPerYear), value: `${mainData?.totalResultsCurrentYear}` },
              {
                label: formatMessage(messages.xdrAverageMoth),
                value: `${mainData?.averageTestsPerMonthCurrentYear.toFixed(0)}`,
              },
              { label: formatMessage(messages.xdrTBToday), value: `${mainData?.totalResultsToday}` },
            ]}
          />
          {donutData.data && donutData.data.length ? (
            <Grid item xs={12}>
              <DonutGraph
                data={donutData.data}
                total={donutData.total}
                graphId="tbResultsByCategory1Aggregate"
                graphTitle={formatMessage(graphMessages.total)}
                showLabel={showLabel}
                tooltip={v => (!showPercentage ? `${v}` : `${((v * 100) / donutData.total).toFixed(2)}%`)}
                label={obj => (!showPercentage ? obj.cnt : `${(obj.percent * 100).toFixed(2)}%`)}
              />
            </Grid>
          ) : null}
        </Grid>
      )}
    </PkPage>
  )
}

export default CurrentDiagnosisGraphPage
