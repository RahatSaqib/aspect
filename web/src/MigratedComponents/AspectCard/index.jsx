import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames/bind';
import Card from '@material-ui/core/Card';
import Grid from '@material-ui/core/Grid';

import AspectTitle from '../AspectTitle';

const cssClasses = classnames.bind(require('./Card.css'));

const CardHeader = ({ props }) => {
  const { title, actionComponent, action } = props;
  const {
    component: ActionComponent,
    props: actionComponentProps
  } = actionComponent;

  return title || actionComponent ? (
    <Grid item xs={12}>
      <Grid
        container
        spacing={24}
        className={cssClasses('card__headerContainer')}
      >
        {title ? (
          <Grid item xs={6} className={cssClasses('card__title')}>
            <AspectTitle title={title} />
          </Grid>
        ) : null}
        {actionComponent ? (
          <Grid item xs={6} className={cssClasses('card__actionsContainer')}>
            <ActionComponent props={{ actionComponentProps, action }} />
          </Grid>
        ) : null}
      </Grid>
    </Grid>
  ) : null;
};

const AspectCard = ({
  children,
  justify,
  innerSize,
  title,
  actionComponent,
  action
}) => {
  return (
    <Card className={cssClasses('card__container')}>
      <Grid container justify={justify} className={cssClasses('card__grid')}>
        <CardHeader props={{ title, actionComponent, action }} />
        <Grid
          item
          xs={12}
          lg={innerSize}
          className={cssClasses('card__content')}
        >
          {children}
        </Grid>
      </Grid>
    </Card>
  );
};

AspectCard.defaultProps = {
  justify: 'center',
  innerSize: 12
};

AspectCard.protoTypes = {
  children: PropTypes.oneOfType([PropTypes.object]).isRequired,
  justify: PropTypes.string,
  innerSize: PropTypes.instanceOf,
  title: PropTypes.string.isRequired
};

export default AspectCard;
