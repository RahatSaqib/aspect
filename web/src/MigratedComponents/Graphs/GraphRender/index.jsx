import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { useQuery } from 'react-query'
import CircularProgress from '@material-ui/core/CircularProgress'
import classnames from 'classnames/bind'
import Grid from '@material-ui/core/Grid'
import isEmpty from 'lodash/isEmpty'

import fetchGraphDataFromConfig from './Redux'
import {
  formatDataByGraphType,
  getGraphKeysFromResults,
} from '../Helpers/Formatters'

const cssClasses = classnames.bind(require('./GraphRender.css'))

const GraphRender = ({ assays, config }) => {
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
    id,
    async () => fetchGraphDataFromConfig({ assays, config }),
    { cacheTime: 3000 }
  )

  if (isError) {
    throw new Error(`Graph data fetch failed: ${error.message}`)
  }

  if (data && !graphData && !graphKeys) {
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

  return (
    <Grid item xs={12} lg={size}>
      <div className={cssClasses('graphrender__container')}>
        {isLoading ? <CircularProgress /> : null}
        {isEmpty(graphData) ? <div>Empty comp</div> : null}
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

export default GraphRender
