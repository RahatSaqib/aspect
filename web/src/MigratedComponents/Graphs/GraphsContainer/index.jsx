import React from 'react'
import PropTypes from 'prop-types'
import Grid from '@material-ui/core/Grid'
import covidGraphs from '../GraphConfigurations/Covid'
import hivGraphs from '../GraphConfigurations/HIV'
import tbGraphs from '../GraphConfigurations/TB'
import treatmentStatusGraphs from '../GraphConfigurations/Treatments'
import deviceStatusGraphs from '../GraphConfigurations/DeviceStatus'
import GraphContainer from './GraphContainer'

const spacing = {
  half: { innerSize: 12, outerSize: 6 },
  full: { innerSize: 9, outerSize: 12 },
}

const { hivResults } = hivGraphs
const { tbResults } = tbGraphs
const { treatmentStatus } = treatmentStatusGraphs
const { deviceStatus } = deviceStatusGraphs
const {
  covidDailyConfirmed,
  covidCasesByAgeAndGender,
  covidMortalityAndRecoveryConfig,
  covidMortalityAndRecoveryByGender,
} = covidGraphs

const GraphsContainer = ({ assaysFromState }) => {
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
      config: treatmentStatus,
      size: full,
      group: 'all',
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
      config: covidMortalityAndRecoveryByGender,
      size: half,
      group: 'covid',
    },
    {
      config: covidCasesByAgeAndGender,
      size: half,
      group: 'covid',
    },
    {
      config: deviceStatus,
      size: full,
      group: 'assaysNotNeeded',
    },
  ]

  return (
    <Grid container direction="row" spacing={8}>
      {graphsToRender.map(({ config, size, group }) => (
        <GraphContainer
          assaysFromState={assaysFromState}
          config={config}
          size={size}
          group={group}
        />
      ))}
    </Grid>
  )
}

GraphsContainer.propTypes = {
  assaysFromState: PropTypes.oneOfType([PropTypes.array]).isRequired,
}

export default GraphsContainer
