/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react'
import { Grid } from '@mui/material'
import classnames from 'classnames/bind'
import isEmpty from 'lodash/isEmpty'
import sortBy from 'lodash/sortBy'
import { useQuery } from 'react-query'
import AspectResponsiveBar from '../../../../components/Graphs/BarGraph/AspectResponsiveBar'
import EmptyGraph from '../../../../components/Graphs/EmptyData'
import { formatDataByGraphType, getGraphKeysFromResults } from '../../../../components/Graphs/Helpers/Formatters'
import messages from '../../../../components/Graphs/intlMessages'
import Loading from '../../../../components/Loading'
import fetchWrapperForQueries from '../../../../components/QueryFetch'
import useI18n from '../../../../hooks/useI18n'
import styles from '../styles.css'

const cssClasses = classnames.bind(styles)

const baseConfig = {
  id: 'suppliesExpiryByPeriod',
  sortByKeys: ['consumableName'],
  clickThrough: {
    allow: true,
    baseUrl: '/browse/inventory?filters=',
    keys: ['daysStockLeft', 'consumableId'],
  },
}

const i18nKeys = {
  moreThan180: 'moreThan180',
  noConsumption: 'noConsumption',
  notRecorded: 'notRecorded',
  outOfStock: 'outOfStock',
  upTo14: 'upTo14',
  upTo30: 'upTo30',
  upTo90: 'upTo90',
  upTo180: 'upTo180',
}

const InventoryStatusGraphMain = ({ assaysFromState, showLabel, filterSelection = null }) => {
  const { formatMessage } = useI18n()

  const [rawData, setRawData] = useState(false)

  const [graphData, setGraphData] = useState(false)
  const [graphKeys, setGraphKeys] = useState(false)

  const params = filterSelection

  const { isLoading, data } = useQuery(['suppliesExpiryByPeriod', { params }], async ({ queryKey: [, { params }] }) => {
    // Call the query only when a consumable is selected - avoiding unnecesary calls to the API
    if (filterSelection) return fetchWrapperForQueries({ endpoint: '/inventory/days-by-location', params })
  })

  useEffect(() => {
    if (data) {
      setRawData(sortBy(data.data, ['consumableName']))
    }
  }, [data])

  function formatRawData() {
    return formatDataByGraphType(
      rawData,
      'actual',
      false,
      'MMM yy',
      'increment',
      'count',
      i18nKeys,
      'barInventory',
      params,
      formatMessage,
      messages
    )
  }

  function setNewData(grouped) {
    const keysFromGrouped = getGraphKeysFromResults(grouped, 'increment')
    setGraphData(grouped)
    setGraphKeys(keysFromGrouped)
  }

  useEffect(() => {
    if (rawData && !isLoading) {
      const grouped = formatRawData()
      if (grouped) {
        setNewData(grouped)
      }
    }
  }, [rawData])

  return !params || isLoading ? (
    <Loading />
  ) : (
    <Grid item xs={12} md={12} lg={12}>
      <div className={cssClasses('Graph_Wrapper')}>
        {graphData && !isEmpty(graphData) ? (
          <AspectResponsiveBar
            assaysFromState={assaysFromState}
            config={{ ...baseConfig, showLabel, showDecimals: 0, labelTextColor: '#FFF' }}
            data={graphData}
            keys={graphKeys}
            indexBy="increment"
            formatDate="MMM yy"
            tickValuesYShape="twos"
            tickValuesXShape="all"
            displayMethod="actual"
            displayLegend={false}
            type="barInventory"
            i18nKeys={i18nKeys}
          />
        ) : (
          <EmptyGraph type="bar" />
        )}
      </div>
    </Grid>
  )
}

export default InventoryStatusGraphMain
