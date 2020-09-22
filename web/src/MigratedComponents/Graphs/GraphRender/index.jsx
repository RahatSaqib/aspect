/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'
import { useQuery } from 'react-query'
import CircularProgress from '@material-ui/core/CircularProgress'
import classnames from 'classnames/bind'
import Grid from '@material-ui/core/Grid'
import isEmpty from 'lodash/isEmpty'
import _ from 'lodash'

import fetchWrapperForQueries from '../../QueryFetch'
import {
  formatDataByGraphType,
  getGraphKeysFromResults,
} from '../Helpers/Formatters'

import EmptyGraph from '../EmptyData'

const cssClasses = classnames.bind(require('./GraphRender.css'))

const prepAssaysForParams = (whiteListed, method) => {
  const assays = []
  _.map(whiteListed, (value, key) => assays.push({ assay: value }))
  return assays
}

const prepParamsForEndPoint = (urlParams, updatedParams) => {
  const params = []
  const paramsToUse =
    updatedParams && !_.isNull(_.values(updatedParams)[0])
      ? updatedParams
      : urlParams

  _.map(paramsToUse, (value, key) =>
    _.isArray(value)
      ? _.map(value, v => params.push({ [key]: v }))
      : params.push({ [key]: value })
  )
  return params
}

const Loading = () => (
  <div className={cssClasses('graphrender__spinner')}>
    <CircularProgress />
  </div>
)

const GraphRender = ({
  assays: { assaysFromState, whiteListed } = false,
  config,
  updatedParams = {},
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
    type,
  } = config
  const assayParams = prepAssaysForParams(whiteListed, method)
  const endpointParams = prepParamsForEndPoint(params, updatedParams)

  const mergedParams = [...assayParams, ...endpointParams]
  const [rawData, setRawData] = useState(false)
  const [graphData, setGraphData] = useState(false)
  const [graphKeys, setGraphKeys] = useState(false)
  const { culture } = useSelector(({ user }) => {
    const { culture } = user.toJS()
    return {
      culture,
    }
  })

  const { isLoading, isError, error } = useQuery(
    [id, { mergedParams }],
    async (key, { mergedParams }) =>
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

  useEffect(() => {
    if (rawData && !isLoading) {
      const grouped = formatDataByGraphType(
        rawData,
        displayMethod,
        filterBy,
        formatDate,
        indexBy,
        keyToConsume,
        type
      )
      if (grouped) {
        const keysFromGrouped = getGraphKeysFromResults(grouped, indexBy)
        setGraphData(grouped)
        setGraphKeys(keysFromGrouped)
      }
    }
  }, [rawData])

  return (
    <Grid item xs={12} lg={size}>
      <div className={cssClasses('graphrender__container')}>
        {isEmpty(graphData) && isLoading ? <Loading /> : null}
        {isEmpty(graphData) && !isLoading ? <EmptyGraph type={type} /> : null}
        {!isEmpty(graphData) ? (
          <Component
            data={graphData}
            keys={graphKeys}
            config={config}
            culture={culture}
            averages={averages}
            assaysFromState={assaysFromState}
          />
        ) : null}
      </div>
    </Grid>
  )
}

GraphRender.defaultProps = {
  updatedParams: {},
}

GraphRender.propTypes = {
  assays: PropTypes.oneOfType([PropTypes.array]).isRequired,
  config: PropTypes.oneOfType([PropTypes.object]).isRequired,
  id: PropTypes.string.isRequired,
  updatedParams: PropTypes.oneOfType([PropTypes.object]),
}

export default GraphRender
