import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useSelector, useDispatch } from 'react-redux'
import Grid from '@material-ui/core/Grid'
import CircularProgress from '@material-ui/core/CircularProgress'

import { fetchClinicalIndicatorsDashboard } from './Redux'
import {
  groupByKey,
  groupForPie,
  getGraphKeysFromResults,
} from '../Helpers/Formatters'

const GraphRender = ({ assays, id: parentId, config }) => {
  const {
    id,
    size,
    component: Component,
    api,
    indexBy,
    keyToConsume,
    tickValuesX,
    tickValuesY,
    displayMethod,
    displayLegend = true,
    formatDate,
    type,
    averages,
  } = config
  const { whitelisted, assaysFromState } = assays
  const dispatch = useDispatch()
  const [data, setData] = useState(false)
  const [graphData, setGraphData] = useState(false)
  const [graphKeys, setGraphKeys] = useState(false)

  const culture = useSelector(({ user }) => {
    const { culture } = user.toJS()
    return culture
  })

  const graphStore = useSelector(({ clinicalIndicators }) => {
    const { [parentId]: parentState = false } = clinicalIndicators.toJS()
    const { [id]: graphState = false } = parentState
    return graphState
  })

  useEffect(() => {
    if (!data) {
      dispatch(
        fetchClinicalIndicatorsDashboard({ parentId, id, whitelisted, api })
      )
    }
  }, [api, data, dispatch, id, parentId, whitelisted])

  useEffect(() => {
    if (!data && Object.keys(graphStore).length > 0) {
      return graphStore && setData(graphStore)
    }
  }, [data, graphStore])

  useEffect(() => {
    if (data && !graphData) {
      let grouped
      const inData = data && data.data
      switch (type) {
        case 'bar':
          grouped = groupByKey(
            inData,
            indexBy,
            keyToConsume,
            displayMethod,
            formatDate
          )
          break

        case 'pie':
          grouped = groupForPie(
            inData,
            keyToConsume,
            indexBy,
            assaysFromState,
            displayMethod,
            'filterResults'
          )
          break

        default:
          grouped = false
          break
      }

      if (grouped) {
        const keysFromGrouped = getGraphKeysFromResults(grouped, indexBy)
        setGraphData(grouped)
        setGraphKeys(keysFromGrouped)
      }
    }
  }, [
    assaysFromState,
    data,
    displayMethod,
    formatDate,
    graphData,
    indexBy,
    keyToConsume,
    type,
  ])

  return (
    <Grid item lg={size}>
      <div style={{ height: '350px' }}>
        {graphData && graphKeys ? (
          <Component
            data={graphData}
            keys={graphKeys}
            indexBy={indexBy}
            displayMethod={displayMethod}
            displayLegend={displayLegend}
            culture={culture}
            averages={averages}
            assaysFromState={assaysFromState}
            tickValues={{ tickValuesX, tickValuesY }}
          />
        ) : (
          <CircularProgress />
        )}
      </div>
    </Grid>
  )
}

export default GraphRender
