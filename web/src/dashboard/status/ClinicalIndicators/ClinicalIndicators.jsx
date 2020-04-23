import React, { useEffect, useState } from 'react';
import Grid from '@material-ui/core/Grid';
import classnames from 'classnames/bind';

import ClinicalIndicatorsContainer from './ClinicalIndicatorsContainer';

import assaysConfiguration from './AssaysConfiguration';

const cssClassesStatus = classnames.bind(require('../Status.css'));

export const ClinicalIndicators = ({ intl, assays: assaysFromState }) => {
  const [assays, setAssays] = useState(false);
  const [months] = useState(5);

  useEffect(() => {
    if (!assays) {
      const whiteListedAssays = assaysConfiguration(intl, assaysFromState);

      return whiteListedAssays && whiteListedAssays.length
        ? setAssays(whiteListedAssays)
        : setAssays(false);
    }
  }, [assays, assaysFromState, intl, months]);

  return assays ? (
    <Grid container spacing={24}>
      {assays.map(assay => {
        const { name } = assay;
        return (
          <ClinicalIndicatorsContainer
            title={name}
            className={cssClassesStatus('Section--withStatus')}
            assay={assay}
            intl={intl}
          />
        );
      })}
    </Grid>
  ) : null;
};

export default ClinicalIndicators;
