/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react'
import { Grid } from '@mui/material'
import classnames from 'classnames/bind'
import isEmpty from 'lodash/isEmpty'
import { useQuery } from 'react-query'
import AspectResponsiveBar from '../../../../components/Graphs/BarGraph/AspectResponsiveBar'
import EmptyGraph from '../../../../components/Graphs/EmptyData'
import {
  formatDataByGraphType,
  getGraphKeysFromResults,
  getPreviousPeriod,
} from '../../../../components/Graphs/Helpers/Formatters'
import messages from '../../../../components/Graphs/intlMessages'
import Loading from '../../../../components/Loading'
import fetchWrapperForQueries from '../../../../components/QueryFetch'
import useI18n from '../../../../hooks/useI18n'
import styles from '../styles.css'

const cssClasses = classnames.bind(styles)

const params = [
  { minDate: getPreviousPeriod('months', "yyyy-MM-dd'T'HH:mm:ss.SSSXXX").start },
  { maxDate: getPreviousPeriod('months', "yyyy-MM-dd'T'HH:mm:ss.SSSXXX").end },
]

const i18nKey = {
  devicesActive: 'devicesActive',
  devicesInactive: 'devicesInactive',
  inactiveUnknown: 'inactiveUnknown',
  inactiveNoTestsPerformed: 'inactiveNoTestsPerformed',
  inactiveOutOfInventory: 'inactiveOutOfInventory',
  inactiveDownForRepair: 'inactiveDownForRepair',
  inactiveDecommissioned: 'inactiveDecommissioned',
  weekendOrHoliday: 'weekendOrHoliday',
  inactiveNoStaff: 'inactiveNoStaff',
  inactiveNoSamples: 'inactiveNoSamples',
  inactiveNoPower: 'inactiveNoPower',
  inactiveOther: 'inactiveOther',
}

const DeviceStatusGraphMain = ({ assaysFromState, showLabel, filterSelection }) => {
  const { formatMessage } = useI18n()
  const [graphData, setGraphData] = useState(false)
  const [graphKeys, setGraphKeys] = useState(false)

  const mergedParams = filterSelection
    ? [{ minDate: filterSelection.minDate }, { maxDate: filterSelection.maxDate }]
    : params

  const { data, isLoading } = useQuery(
    ['deviceStatusMonthly', { mergedParams }],
    async ({ queryKey: [, { mergedParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/dashboard/operational-data/activity-over-time', params: mergedParams })
  )

  function formatRawData() {
    return formatDataByGraphType(
      data.data,
      'percentage',
      false,
      'LLLL do',
      'date',
      'devicesActive',
      i18nKey,
      'stackedDeviceActivity',
      mergedParams,
      formatMessage,
      messages
    )
  }

  function setNewData(grouped) {
    const keysFromGrouped = getGraphKeysFromResults(grouped, 'date')
    setGraphData(grouped)
    setGraphKeys(keysFromGrouped)
  }

  useEffect(() => {
    if (data && data.data) {
      const grouped = formatRawData()
      if (grouped) {
        setNewData(grouped)
      }
    }
  }, [data])

  return isLoading ? (
    <Loading />
  ) : (
    <Grid item xs={12} md={12} lg={12}>
      <div className={cssClasses('Graph_Wrapper')}>
        {graphData && !isEmpty(graphData) ? (
          <AspectResponsiveBar
            assaysFromState={assaysFromState}
            config={{ id: 'deviceStatusMonthly', showLabel, showDecimals: 0, labelTextColor: '#FFF' }}
            data={graphData}
            keys={graphKeys}
            indexBy="date"
            formatDate="LLLL do"
            legendsToPopover={[
              {
                externalId: 'inactiveUnknown',
                tooltip: { show: true, placement: 'top', message: 'statusUnknownLegend' },
              },
            ]}
            legendsNotToRender={['inactiveDecommissioned']}
            tickValuesYShape="clubsandwich"
            tickValuesXShape="all"
            displayMethod="percentage"
            displayLegend
            type="stackedDeviceActivity"
            i18nKeys={i18nKey}
          />
        ) : (
          <EmptyGraph type="bar" />
        )}
      </div>
    </Grid>
  )
}

export default DeviceStatusGraphMain
