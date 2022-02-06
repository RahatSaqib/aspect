/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import reduce from 'lodash/reduce'
import { useQuery } from 'react-query'
import CircularProgress from '@material-ui/core/CircularProgress'
import classnames from 'classnames/bind'
import Grid from '@material-ui/core/Grid'
import isEmpty from 'lodash/isEmpty'
import isObject from 'lodash/isObject'
import messages from '../intlMessages'
import fetchWrapperForQueries from '../../QueryFetch'
import {
  formatDataByGraphType,
  getGraphKeysFromResults,
  prepAssaysForParams,
  prepParamsForEndPoint,
} from '../Helpers/Formatters'

import EmptyGraph from '../EmptyData'
import { useAuthState } from '../../../Providers/AuthProvider'
import handleClientSideFilterState from './ClientSideFilters'
import styles from './GraphRender.css'

const cssClasses = classnames.bind(styles)

const Loading = () => (
  <div className={cssClasses('graphrender__spinner')}>
    <CircularProgress />
  </div>
)

const GraphRender = ({
  assays: { assaysFromState, whiteListed } = false,
  config,
  updatedParams = {},
  formatMessage,
  clientSideFilter = false,
}) => {
  const {
    api: { endpoint, params, method } = false,
    averages,
    component: Component,
    size,
    displayMethod,
    filterBy = false,
    formatDate,
    id,
    indexBy,
    keyToConsume,
    i18nKey,
    type,
  } = config

  const { culture } = useAuthState()
  const assayParams = prepAssaysForParams(whiteListed, method)
  const endpointParams = prepParamsForEndPoint(params, updatedParams)
  const mergedParams = [...assayParams, ...endpointParams]
  const [rawData, setRawData] = useState(false)
  const [i18nKeys, setI18nKeys] = useState([])
  const [graphData, setGraphData] = useState(false)
  const [graphKeys, setGraphKeys] = useState(false)
  const { isLoading, isError, error } = useQuery(
    [id, { mergedParams }],
    async ({ queryKey: [, { mergedParams }] }) =>
      fetchWrapperForQueries({
        endpoint,
        method,
        params: mergedParams,
      }),
    { onSuccess: ({ data }) => setRawData(data) }
  )
  if (isError) {
    throw new Error(`Graph data fetch failed: ${error.message}`)
  }

  function buildI18nKeys() {
    let i18nKeysCollection = {}
    if (i18nKey) {
      if (isObject(i18nKey)) i18nKeysCollection = i18nKey
      else
        i18nKeysCollection = reduce(
          rawData,
          (acc, curr) => {
            acc[curr[keyToConsume]] = curr[i18nKey]
            return acc
          },
          {}
        )
      setI18nKeys(i18nKeysCollection)
      return i18nKeysCollection
    }
  }

  function formatRawData() {
    const i18nKeysCollection = buildI18nKeys()
    return formatDataByGraphType(
      rawData,
      displayMethod,
      filterBy,
      formatDate,
      indexBy,
      keyToConsume,
      i18nKeysCollection,
      type,
      mergedParams,
      formatMessage,
      messages
    )
  }

  function setNewData(grouped) {
    const keysFromGrouped = getGraphKeysFromResults(grouped, indexBy)
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

  useEffect(() => {
    return handleClientSideFilterState(
      clientSideFilter,
      { id, i18nKeys, graphData },
      { formatRawData, setNewData }
    )
  }, [clientSideFilter, graphData])

  return (
    <Grid item xs={12} md={size} lg={size}>
      <div className={cssClasses('graphrender__container')}>
        {(!graphData || isEmpty(graphData)) && isLoading ? <Loading /> : null}
        {(!graphData || isEmpty(graphData)) && !isLoading ? (
          <EmptyGraph type={type} />
        ) : null}
        {graphData && !isEmpty(graphData) && !isLoading ? (
          <Component
            data={graphData}
            keys={graphKeys}
            config={config}
            culture={culture}
            averages={averages}
            assaysFromState={assaysFromState}
            i18n={messages}
            i18nKeys={i18nKeys}
          />
        ) : null}
      </div>
    </Grid>
  )
}

GraphRender.defaultProps = {
  updatedParams: {},
  clientSideFilter: false,
}

GraphRender.propTypes = {
  assays: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
  config: PropTypes.oneOfType([PropTypes.object]).isRequired,
  clientSideFilter: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  id: PropTypes.string.isRequired,
  updatedParams: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  formatMessage: PropTypes.func.isRequired,
}

export default GraphRender
