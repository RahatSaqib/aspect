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
    filterResults = false,
    formatDate,
    type,
    averages,
  } = config
  const dispatch = useDispatch()
  const { whitelisted, assaysFromState } = assays
  const [graphData, setGraphData] = useState(false)
  const [graphKeys, setGraphKeys] = useState(false)

  const { culture, graphState } = useSelector(state => {
    const { user, clinicalIndicators } = state
    const { culture } = user.toJS()
    const { [parentId]: parentState = false } = clinicalIndicators.toJS()
    const { [id]: graphState = false } = parentState
    return {
      culture,
      graphState,
    }
  })

  useEffect(() => {
    if (!graphState) {
      dispatch(
        fetchClinicalIndicatorsDashboard({
          parentId,
          id,
          whitelisted,
          api,
        })
      )
    }

    if (graphState && (!graphData || !graphKeys)) {
      const { data } = graphState
      if (data && data.length) {
        let grouped
        switch (type) {
          case 'bar':
            grouped = groupByKey(
              data,
              indexBy,
              keyToConsume,
              displayMethod,
              formatDate
            )
            break

          case 'pie':
            grouped = groupForPie(data, keyToConsume, indexBy, filterResults)
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
    }
    // https://github.com/facebook/react/issues/16313#issuecomment-587149109
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphState])

  return (
    <Grid item lg={size}>
      <div
        style={{
          height: '350px',
        }}
      >
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
            tickValues={{
              tickValuesX,
              tickValuesY,
            }}
          />
        ) : (
          <CircularProgress />
        )}
      </div>
    </Grid>
  )
}

export default GraphRender
