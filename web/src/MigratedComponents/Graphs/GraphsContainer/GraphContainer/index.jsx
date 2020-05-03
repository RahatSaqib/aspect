import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import Grid from '@material-ui/core/Grid'
import AspectCard from '../../../AspectCard'
import GraphRender from '../../GraphRender'

import { validateGraphConfig } from '../../Helpers/Formatters'

const cssClasses = classnames.bind(require('../GraphsContainer.css'))

const GraphContainer = ({ config, size, assaysFromState }) => {
  const { assays, graphType, id } = config
  const { innerSize, outerSize } = size
  const [whiteListed, setwhiteListed] = useState(false)

  useEffect(() => {
    const allowed = []
    validateGraphConfig(config).then(() => {
      assays.map(a =>
        assaysFromState.filter(
          ({ externalId, hasResults }) =>
            externalId === a && hasResults && allowed.push(a)
        )
      )
      setwhiteListed(allowed)
    })
  }, [config, assays, assaysFromState])

  return whiteListed && whiteListed.length ? (
    <Grid item xs={12} lg={outerSize}>
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
                assays={{ whiteListed, assaysFromState }}
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
