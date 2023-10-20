import React, { useState, useEffect } from 'react'
import { FormControlLabel, Grid, Switch, Typography } from '@mui/material'
import endOfMonth from 'date-fns/endOfMonth'
import endOfYear from 'date-fns/endOfYear'
import startOfMonth from 'date-fns/startOfMonth'
import startOfYear from 'date-fns/startOfYear'
import reduce from 'lodash/reduce'
import { useNavigate } from 'react-router'
import {
  LgaSelect,
  StateSelect,
  Loading,
  genLabel,
  negateTimeZoneOffset,
  objectToArray,
  ColumnGraph,
  formatDataByGraphType,
} from '../../../../../cleanComponents'
import intlMessages from '../../../../../cleanComponents/Graphs/graphMessages'
import useAssayList from '../../../../../hooks/assay/useAssayList'
import useI18n from '../../../../../hooks/useI18n'
import { getCustomMessage, graphMessages } from '../../../../../messages'
import { useAuthState } from '../../../../../providers/AuthProvider'
import { useFilterUpdate } from '../../../../../providers/FilterProvider'
import PkPage from '../../../components/PkPage'
import TripleCardSide from '../../../components/TripleCardSide'
import { useMtpRifResults } from '../../../hooks/useMtpRifResults'
import messages from '../../../PkDashboard.Messages'

const defaultFilters = [
  { groupBy: 'month' },
  { groupBy: 'assay' },
  { resultCategory1: 'Detected' },
  { minDate: startOfYear(new Date()) },
  { maxDate: endOfYear(new Date()) },
  { flags: 'GET_TOTAL_RESULTS_IN_CURRENT_YEAR' },
  { flags: 'GET_AVERAGE_RESULTS_PER_MONTH_CURRENT_YEAR' },
  { flags: 'GET_TOTAL_RESULTS_IN_LAST_24_HOURS' },
]

// const pieGraphParams = [{ groupBy: 'resultCategory1' }, { minDate }, { maxDate:endOfMonth(new Date()) }]

const CurrentDiagnosisGraphPage = () => {
  const { formatMessage, format } = useI18n()
  const user = useAuthState()
  const [showLabel, setShowLabel] = useState(true)
  // const [showPercentage, setShowPercentage] = useState(false)
  const [filter, setFilter] = useState()
  const { data: assays } = useAssayList()

  const navigate = useNavigate()
  const [addFilter] = useFilterUpdate()

  const { data: mainData, isLoading: isLoadingMain } = useMtpRifResults(objectToArray(filter).concat(defaultFilters))
  // const { data: pieData, isLoading: isLoadingPie } = useMtpRifResults(objectToArray(filter).concat(pieGraphParams))

  // const [donutData, setDonutData] = useState({})
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
      const expandedBarData = []
      groupedForBar.map(result => {
        const allKeysButMonth = Object.keys(result).filter(key => key !== 'month')
        allKeysButMonth.map(key =>
          expandedBarData.push({
            id: key,
            month: format(negateTimeZoneOffset(new Date(result.month)), 'MMM-yyyy'),
            value: +result[key].toFixed(3).slice(0, -1),
            type: genLabel(key, assays, formatMessage, intlMessages, i18nKeys),
            originalMonth: result.month,
          })
        )
        return result
      })

      setBarData({ data: expandedBarData })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainData, assays])

  return (
    <PkPage
      title={formatMessage(messages.peopleDiagnosedRif)}
      filters={
        <>
          <FormControlLabel
            sx={{ minWidth: '145px' }}
            label={formatMessage(graphMessages.showValuesLabel)}
            control={<Switch checked={showLabel} onChange={e => setShowLabel(e.target.checked)} />}
          />
          {/* <FormControlLabel
            sx={{ minWidth: '145px' }}
            label={formatMessage(graphMessages.showPercentage)}
            control={<Switch checked={showPercentage} onChange={e => setShowPercentage(e.target.checked)} />}
          /> */}
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
      {isLoadingMain ? (
        <Loading />
      ) : (
        <Grid container sx={{ mt: 2 }}>
          {barData.data && barData.data.length ? (
            <Grid item xs={12} md={8}>
              <Typography sx={{ m: '10px' }} variant="h6" color="primary" component="div">
                {formatMessage(messages.testsPerformedYear)}
              </Typography>
              <ColumnGraph
                data={barData.data}
                graphId="testPerformedMonthlyPercentage"
                xField="month"
                yField="value"
                seriesField="type"
                showLabel={showLabel}
                colors="#34717c"
                onReady={plot => {
                  plot.on('plot:click', evt => {
                    const base = 'yyyy-MM-dd'
                    const parsedDate = negateTimeZoneOffset(new Date(evt.data.data.originalMonth), base)

                    const baseUrl = '/browse/result'
                    addFilter(
                      {
                        displayResult: 'actual',
                        maxDate: format(endOfMonth(parsedDate), base),
                        minDate: format(startOfMonth(parsedDate), base),
                        onlyReportableResults: true,
                        assayId: assays.find(a => a.externalId === evt.data.data.id).id,
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
              { label: formatMessage(messages.xdrCasesPerYear), value: `${mainData?.totalResultsCurrentYear}` },
              {
                label: formatMessage(messages.xdrAverageMoth),
                value: `${mainData?.averageTestsPerMonthCurrentYear}`,
              },
              { label: formatMessage(messages.xdrLastDay), value: `${mainData?.totalResultsInLast24Hours}` },
            ]}
          />
          {/* <TestsOverTimeGraphHalf data={pieData?.data} assaysFromState={assays} showLabel={showLabel} /> */}
        </Grid>
      )}
    </PkPage>
  )
}

export default CurrentDiagnosisGraphPage
