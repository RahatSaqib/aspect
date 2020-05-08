import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import { useSelector, useDispatch } from 'react-redux'
import Grid from '@material-ui/core/Grid'
import CircularProgress from '@material-ui/core/CircularProgress'

import { fetchClinicalIndicatorsDashboard } from './Redux'
import {
  formatDataByGraphType,
  getGraphKeysFromResults,
} from '../Helpers/Formatters'

const cssClasses = classnames.bind(require('./GraphRender.css'))

const GraphRender = ({ assays, id: parentId, config, title }) => {
  const dispatch = useDispatch()
  const { whiteListed, assaysFromState } = assays
  const { id, size, api, type, averages } = config
  const {
    component: Component,
    displayMethod,
    formatDate,
    filterBy = false,
    indexBy,
    keyToConsume,
  } = config
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
      console.log(parentId, id, whiteListed, api, title)

      dispatch(
        fetchClinicalIndicatorsDashboard({
          parentId,
          id,
          whiteListed,
          api,
          title,
        })
      )
    }

    if (graphState && (!graphData || !graphKeys)) {
      const { data } = graphState
      if (data && data.length) {
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
    }
  }, [graphState])

  return (
    <Grid item xs={12} lg={size}>
      <div className={cssClasses('graphrender__container')}>
        {graphData && graphKeys ? (
          <Component
            data={graphData}
            keys={graphKeys}
            config={config}
            culture={culture}
            averages={averages}
            assaysFromState={assaysFromState}
          />
        ) : (
          <div className={cssClasses('graphrender__spinner')}>
            <CircularProgress />
          </div>
        )}
      </div>
    </Grid>
  )
}

GraphRender.propTypes = {
  assays: PropTypes.oneOfType([PropTypes.array]).isRequired,
  config: PropTypes.oneOfType([PropTypes.object]).isRequired,
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
}

export default GraphRender
