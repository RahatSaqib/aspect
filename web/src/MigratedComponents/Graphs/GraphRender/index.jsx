/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'
import { useQuery } from 'react-query'
import CircularProgress from '@material-ui/core/CircularProgress'
import classnames from 'classnames/bind'
import Grid from '@material-ui/core/Grid'
import isEmpty from 'lodash/isEmpty'

import fetchGraphDataFromConfig from './Queries'
import {
  formatDataByGraphType,
  getGraphKeysFromResults,
} from '../Helpers/Formatters'

import EmptyGraph from '../EmptyData'

const cssClasses = classnames.bind(require('./GraphRender.css'))

const GraphRender = ({ assays, config, updatedParams = {} }) => {
  const {
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
  const { assaysFromState } = assays
  const [graphData, setGraphData] = useState(false)
  const [graphKeys, setGraphKeys] = useState(false)
  const { culture } = useSelector(({ user }) => {
    const { culture } = user.toJS()
    return { culture }
  })

  const { isLoading, isError, data, error } = useQuery(
    [id, { ...updatedParams }],
    async (key, { ...updatedParams }) =>
      fetchGraphDataFromConfig({ assays, config, updatedParams })
  )

  if (isError) {
    throw new Error(`Graph data fetch failed: ${error.message}`)
  }

  useEffect(() => {
    if (data && !isLoading) {
      const grouped = formatDataByGraphType(
        data,
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
  }, [data])

  return (
    <Grid item xs={12} lg={size}>
      <div className={cssClasses('graphrender__container')}>
        {isEmpty(graphData) && isLoading ? <CircularProgress /> : null}
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
