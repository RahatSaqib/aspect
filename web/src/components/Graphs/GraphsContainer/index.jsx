/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react'
import Grid from '@mui/material/Grid'
import PropTypes from 'prop-types'
import { isAllowedGroupsWithoutAssays, getWhitelistedAssays } from '../../../utils/utils/graph'
import { validateGraphConfig } from '../Helpers/Formatters'
import GraphContainer from './GraphContainer'

const spacing = {
  half: { innerSize: 12, outerSize: 6 },
  full: { innerSize: 9, outerSize: 12 },
  row: { innerSize: 10, outerSize: 12 },
}

const GraphsContainer = ({ assaysFromState, classNames, config }) => {
  const { assays, componentSize, group } = config
  const allowedGroupsWithoutAssays = isAllowedGroupsWithoutAssays(group)
  const [whiteListed, setWhiteListed] = useState(false)

  useEffect(() => {
    if (assays && assays.length) {
      validateGraphConfig(config).then(() => {
        const allowedAssays = getWhitelistedAssays({ assays, assaysFromState })
        setWhiteListed(allowedAssays)
      })
    }
  }, [config, assays, assaysFromState])

  return (
    <Grid container direction="row" spacing={8}>
      {(whiteListed && whiteListed.length) || allowedGroupsWithoutAssays ? (
        <GraphContainer
          assaysFromState={assaysFromState}
          classNames={classNames}
          config={config}
          size={spacing[componentSize]}
          whiteListed={whiteListed}
        />
      ) : null}
    </Grid>
  )
}

GraphsContainer.defaultProps = {
  assaysFromState: [],
  classNames: null,
}

GraphsContainer.propTypes = {
  assaysFromState: PropTypes.oneOfType([PropTypes.array]),
  classNames: PropTypes.oneOfType([PropTypes.object]),
  config: PropTypes.oneOfType([PropTypes.object]).isRequired,
}

export default GraphsContainer
