import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import classnames from 'classnames/bind';
import Grid from '@material-ui/core/Grid';
import AspectCard from '../../../AspectCard';
import GraphRender from '../../GraphRender';
import CardSelectors from '../../CardSelectors';

import messages from '../messages';

import { validateGraphConfig } from '../../Helpers/Formatters';

const cssClasses = classnames.bind(require('../GraphsContainer.css'));

const GraphContainer = ({ config, size, assaysFromState }) => {
  const { title, selectorModifiers = false } = config;
  const { formatMessage: intlFormatMessage } = useIntl();
  const { assays, graphType, id } = config;
  const { innerSize, outerSize } = size;
  const [whiteListed, setwhiteListed] = useState(false);

  useEffect(() => {
    const allowed = [];
    validateGraphConfig(config).then(() => {
      assays.map(a =>
        assaysFromState.filter(
          ({ externalId, hasResults }) =>
            externalId === a && hasResults && allowed.push(a)
        )
      );
      setwhiteListed(allowed);
    });
  }, [config, assays, assaysFromState]);

  return whiteListed && whiteListed.length ? (
    <Grid item xs={12} lg={outerSize}>
      <Grid container spacing={24}>
        <Grid item xs={12}>
          <AspectCard
            title={intlFormatMessage(messages[title])}
            innerSize={innerSize}
            justify="center"
            actionComponent={{
              component: CardSelectors,
              props: selectorModifiers
            }}
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
      </Grid>
    </Grid>
  ) : null;
};

GraphContainer.protoTypes = {
  config: PropTypes.oneOfType([PropTypes.object]).isRequired,
  size: PropTypes.oneOfType([PropTypes.object]).isRequired,
  assaysFromState: PropTypes.oneOfType([PropTypes.array]).isRequired
};

export default GraphContainer;
