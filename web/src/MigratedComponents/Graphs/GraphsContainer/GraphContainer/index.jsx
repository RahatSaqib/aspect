import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import classnames from 'classnames/bind';
import Grid from '@material-ui/core/Grid';
import AspectCard from '../../../AspectCard';
import GraphRender from '../../GraphRender';
import CardSelectors from '../../CardSelectors';

import { fetchClinicalIndicatorsDashboard } from '../../GraphRender/Redux';
import { validateGraphConfig } from '../../Helpers/Formatters';
import messages from '../messages';

const cssClasses = classnames.bind(require('../GraphsContainer.css'));

const GraphContainer = ({ config, size, assaysFromState }) => {
  const dispatch = useDispatch();
  const { title, selectorModifiers = false } = config;
  const { formatMessage: intlFormatMessage } = useIntl();
  const { assays, graphType, id } = config;
  const { innerSize, outerSize } = size;
  const [dispatchParams, setDispatchParams] = useState(false);
  const [dispatchFromChild, setDispactFromChild] = useState(false);
  const [dispatchFromSelector, setdispatchFromSelector] = useState(false);
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

  // useEffect(() => {}, dispatchParams);

  useEffect(() => {
    if (dispatchFromSelector) {
      const { identifier, value } = dispatchFromSelector;
      const { api } = dispatchFromChild;
      const { params } = api;
      // const tempParams =
      console.log(dispatchFromChild);

      dispatch(
        fetchClinicalIndicatorsDashboard({
          ...dispatchFromChild,
          api: { ...api, params: { ...params, [identifier]: value } }
        })
      );
    }
  }, [dispatchFromSelector, dispatchFromChild]);

  useEffect(() => {
    const { graphState } = dispatchFromChild;
    if (dispatchFromChild && graphState === false) {
      dispatch(fetchClinicalIndicatorsDashboard({ ...dispatchFromChild }));
    }
    if (dispatchFromChild && graphState) {
      setDispactFromChild(dispatchFromChild);
    }
  }, [dispatchFromChild]);

  return whiteListed && whiteListed.length ? (
    <Grid item xs={12} lg={outerSize}>
      <Grid container spacing={24}>
        <Grid item xs={12}>
          <AspectCard
            title={intlFormatMessage(messages[title])}
            innerSize={innerSize}
            justify="center"
            action={params => setdispatchFromSelector({ ...params })}
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
                    action={params => setDispactFromChild({ ...params })}
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
