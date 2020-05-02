import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import Grid from '@material-ui/core/Grid'
import AspectCard from '../../AspectCard'
import GraphRender from '../GraphRender'

const cssClasses = classnames.bind(require('./GraphContainer.css'))

const GraphContainer = ({
  intl,
  history,
  location,
  assaysFromState,
  config,
}) => {
  const whitelisted = []
  const { assays, graphType, id } = config

  assays.map(a =>
    assaysFromState.filter(
      ({ externalId, hasResults }) =>
        externalId === a && hasResults && whitelisted.push(a)
    )
  )

  return whitelisted && whitelisted.length ? (
    <AspectCard title="This is new and shiny" innerSize={9} justify="center">
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
  ) : null
}

GraphContainer.defaultProps = {
  assays: [],
  config: {},
}

GraphContainer.propTypes = {
  intl: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  assaysFromState: PropTypes.array.isRequired,
  assays: PropTypes.array,
  config: PropTypes.object,
}

export default GraphContainer
