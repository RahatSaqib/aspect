/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react'
import { Grid } from '@mui/material'
import classnames from 'classnames/bind'
import isEmpty from 'lodash/isEmpty'
import { useQuery } from 'react-query'
import EmptyGraph from '../../../../components/Graphs/EmptyData'
import { formatDataByGraphType, dateRangeOptions } from '../../../../components/Graphs/Helpers/Formatters'
import messages from '../../../../components/Graphs/intlMessages'
import AspectResponsiveRow from '../../../../components/Graphs/PieRowGraph/AspectResponsiveRow'
import Loading from '../../../../components/Loading'
import fetchWrapperForQueries from '../../../../components/QueryFetch'
import useI18n from '../../../../hooks/useI18n'
import DATE_CONSTS from '../../../../utils/consts/DateTime/CONSTS'
import styles from '../styles.css'

const cssClasses = classnames.bind(styles)

const { DATE_RANGE_OPTIONS } = DATE_CONSTS

const dateRanges = dateRangeOptions('resultsDateRange', false)
const currentMonth = dateRanges.resultsDateRange.find(dr => dr.id === DATE_RANGE_OPTIONS.CURRENT_MONTH).value.minDate

const ResultTransmittedGraphMain = ({ showLabel, filterSelection }) => {
  const { formatMessage } = useI18n()
  const [graphData, setGraphData] = useState(false)

  const mergedParams = filterSelection ? [{ currentMonth: filterSelection.minDate }] : [{ currentMonth }]

  const { data, isLoading } = useQuery(
    ['resultsTransmittedDials', { mergedParams }],
    async ({ queryKey: [, { mergedParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/dashboard/results-transmitted', params: mergedParams })
  )

  function formatRawData() {
    return formatDataByGraphType(
      data.data,
      'percentage',
      false,
      'LLLL do',
      'date',
      'devicesActive',
      undefined,
      'pieRow',
      mergedParams,
      formatMessage,
      messages
    )
  }

  useEffect(() => {
    if (data && data.data) {
      const grouped = formatRawData()
      if (grouped) {
        setGraphData(grouped)
      }
    }
  }, [data])

  return isLoading ? (
    <Loading />
  ) : (
    <Grid item xs={12} md={12} lg={12}>
      <div className={cssClasses('Graph_Wrapper')}>
        {graphData && !isEmpty(graphData) ? (
          <AspectResponsiveRow
            data={graphData}
            componentClasses={['piegraph__container--nobg']}
            config={{ showLabel, showDecimals: 0, labelTextColor: '#333' }}
          />
        ) : (
          <EmptyGraph type="pieRow" />
        )}
      </div>
    </Grid>
  )
}

export default ResultTransmittedGraphMain
