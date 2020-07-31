import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import Grid from '@material-ui/core/Grid'
import GraphContainer from './GraphContainer'
import { validateGraphConfig } from '../Helpers/Formatters'

const spacing = {
  half: { innerSize: 12, outerSize: 6 },
  full: { innerSize: 9, outerSize: 12 },
}

const GraphsContainer = ({ assaysFromState, config, size, group }) => {
  const { assays, graphType, id } = config
  const [whiteListed, setwhiteListed] = useState(false)

  useEffect(() => {
    const allowed = []
    validateGraphConfig(config).then(() => {
      if (assays && assays.length > 0) {
        assays.map(a =>
          assaysFromState.filter(
            ({ externalId, hasResults }) =>
              externalId === a && hasResults && allowed.push(a)
          )
        )
      }
      setwhiteListed(allowed)
    })
  }, [config, assays, assaysFromState])

  return (
    <Grid container direction="row" spacing={8}>
      <GraphContainer
        assaysFromState={assaysFromState}
        config={config}
        size={spacing[size]}
        group={group}
      />
    </Grid>
  )
}

GraphsContainer.defaultProps = {
  size: 'full',
}

GraphsContainer.propTypes = {
  assaysFromState: PropTypes.oneOfType([PropTypes.array]).isRequired,
  config: PropTypes.oneOfType([PropTypes.object]).isRequired,
  size: PropTypes.string,
  group: PropTypes.string.isRequired,
}

export default GraphsContainer
