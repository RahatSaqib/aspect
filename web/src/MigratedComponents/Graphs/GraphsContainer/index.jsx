import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import Grid from '@material-ui/core/Grid'
import covidGraphs from '../GraphConfigurations/Covid'
import hivGraphs from '../GraphConfigurations/HIV'
import tbGraphs from '../GraphConfigurations/TB'
import GraphContainer from './GraphContainer'

const cssClasses = classnames.bind(require('./GraphsContainer.css'))

const spacing = {
  half: { innerSize: 12, outerSize: 6 },
  full: { innerSize: 9, outerSize: 12 },
}

const GraphsContainer = ({ intl, history, location, assaysFromState }) => {
  const { hivResults } = hivGraphs
  const { tbResults } = tbGraphs
  const {
    covidDailyConfirmed,
    covidRecoveryByGender,
    covidMortalityAndRecoveryConfig,
  } = covidGraphs
  const { full, half } = spacing

  const graphsToRender = [
    {
      config: hivResults,
      size: full,
      group: 'hiv',
    },
    {
      config: tbResults,
      size: full,
      group: 'tb',
    },
    {
      config: covidDailyConfirmed,
      size: full,
      group: 'covid',
    },
    {
      config: covidMortalityAndRecoveryConfig,
      size: full,
      group: 'covid',
    },
    {
      config: covidRecoveryByGender,
      size: full,
      group: 'covid',
    },
  ]

  return (
    <Grid container direction="row" spacing={8}>
      {graphsToRender.map(({ config, size }) => (
        <GraphContainer
          assaysFromState={assaysFromState}
          config={config}
          size={size}
        />
      ))}
    </Grid>
  )
}

GraphsContainer.propTypes = {
  intl: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  assaysFromState: PropTypes.array.isRequired,
}

export default GraphsContainer
