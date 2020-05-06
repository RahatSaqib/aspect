import React, { createContext } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames/bind';
import Grid from '@material-ui/core/Grid';
import covidGraphs from '../GraphConfigurations/Covid';
import hivGraphs from '../GraphConfigurations/HIV';
import tbGraphs from '../GraphConfigurations/TB';
import treatmentStatusGraphs from '../GraphConfigurations/Treatments';
import GraphContainer from './GraphContainer';
import IntlContext from '../Helpers/Context/i18n';

const cssClasses = classnames.bind(require('./GraphsContainer.css'));

const spacing = {
  half: { innerSize: 12, outerSize: 6 },
  full: { innerSize: 9, outerSize: 12 }
};

const { hivResults } = hivGraphs;
const { tbResults } = tbGraphs;
const { treatmentStatus } = treatmentStatusGraphs;
const {
  covidDailyConfirmed,
  covidCasesByAgeAndGender,
  covidMortalityAndRecoveryConfig,
  covidMortalityAndRecoveryByGender
} = covidGraphs;

const GraphsContainer = ({ intl, assaysFromState }) => {
  const { full, half } = spacing;
  const graphsToRender = [
    {
      config: treatmentStatus,
      size: full,
      group: 'all'
    },
    {
      config: hivResults,
      size: full,
      group: 'hiv'
    },
    {
      config: tbResults,
      size: full,
      group: 'tb'
    },
    {
      config: covidDailyConfirmed,
      size: full,
      group: 'covid'
    },
    {
      config: covidMortalityAndRecoveryConfig,
      size: full,
      group: 'covid'
    },
    {
      config: covidMortalityAndRecoveryByGender,
      size: half,
      group: 'covid'
    },
    {
      config: covidCasesByAgeAndGender,
      size: half,
      group: 'covid'
    }
  ];

  return (
    <IntlContext.Provider value={intl}>
      <Grid container direction="row" spacing={8}>
        {graphsToRender.map(({ config, size }) => (
          <GraphContainer
            assaysFromState={assaysFromState}
            config={config}
            size={size}
          />
        ))}
      </Grid>
    </IntlContext.Provider>
  );
};

GraphsContainer.propTypes = {
  intl: PropTypes.oneOfType([PropTypes.object]).isRequired,
  assaysFromState: PropTypes.oneOfType([PropTypes.array]).isRequired
};

export default GraphsContainer;
