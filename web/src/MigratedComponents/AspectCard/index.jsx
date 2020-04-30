import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames/bind';
import Card from '@material-ui/core/Card';
import Grid from '@material-ui/core/Grid';

import AspectTitle from '../AspectTitle';

const cssClasses = classnames.bind(require('./Card.css'));

const AspectCard = ({ children, justify, innerSize, title }) => (
  <Card className={cssClasses('card__container')}>
    <Grid container justify={justify} className={cssClasses('card__grid')}>
      {title ? (
        <Grid item lg={12} className={cssClasses('card__title')}>
          <AspectTitle title={title} />
        </Grid>
      ) : null}
      <Grid item lg={innerSize} xs={12}>
        {children}
      </Grid>
    </Grid>
  </Card>
);

AspectCard.defaultProps = {
  justify: 'center',
  innerSize: 12
};

AspectCard.protoTypes = {
  children: PropTypes.object.isRequired,
  justify: PropTypes.string,
  innerSize: PropTypes.instanceOf,
  title: PropTypes.string.isRequired
};

export default AspectCard;
