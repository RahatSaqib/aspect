import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import Grid from '@material-ui/core/Grid'
import AspectCard from '../../../AspectCard'
import GraphRender from '../../GraphRender'

const cssClasses = classnames.bind(require('../GraphsContainer.css'))

const GraphContainer = ({ config, size, assaysFromState }) => {
  const whitelisted = []
  const { assays, graphType, id } = config
  const { innerSize, outerSize } = size
  assays.map(a =>
    assaysFromState.filter(
      ({ externalId, hasResults }) =>
        externalId === a && hasResults && whitelisted.push(a)
    )
  )
  return whitelisted && whitelisted.length ? (
    <Grid item lg={outerSize}>
      <AspectCard
        title="This is new and shiny"
        innerSize={innerSize}
        justify="center"
      >
        <Grid
          container
          spacing={8}
          className={cssClasses('graph__containerGrid')}
        >
          {graphType &&
            graphType.map(graph => (
              <GraphRender
                assays={{ whitelisted, assaysFromState }}
                config={graph}
                id={id}
              />
            ))}
        </Grid>
      </AspectCard>
    </Grid>
  ) : null
}

GraphContainer.protoTypes = {
  config: PropTypes.object.isRequired,
  size: PropTypes.object.isRequired,
  assaysFromState: PropTypes.array.isRequired,
}

export default GraphContainer
