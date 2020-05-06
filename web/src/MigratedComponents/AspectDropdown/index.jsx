import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import Grid from '@material-ui/core/Grid';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import get from 'lodash/get';
import IntlContext from '../Graphs/Helpers/Context/i18n';
import messages from '../../auth/resetPassword/messages';

const AspectDropdown = ({ id: dropDownName, reduxStateId, size }) => {
  const [assayId, setAssayId] = useState(null);
  const [data, setData] = useState(false);
  const reduxData = useSelector(state => get(state.toJS(), reduxStateId));

  useEffect(() => {
    if (!data) {
      setData(reduxData);
    }
  }, [reduxData]);

  console.log(data);
  return data && data.length ? (
    <Grid item xl={size} style={{ background: 'blue' }}>
      (
      <IntlContext.Consumer>
        {({ formatMessage: intlFormatMessage }) => {
          {
            /* const defaultOption = intlFormatMessage(messages[]) */
          }
          const defaultOption = dropDownName;
          return (
            <Grid container>
              <Grid item>
                <Select value={defaultOption}>
                  <MenuItem value={defaultOption}>
                    <em>{defaultOption}</em>
                  </MenuItem>
                  {data.map(({ id, name }) => (
                    <MenuItem value={id}>{name}</MenuItem>
                  ))}
                </Select>
              </Grid>
            </Grid>
          );
        }}
      </IntlContext.Consumer>
      )
    </Grid>
  ) : null;
};

AspectDropdown.defaultProps = {
  size: 12
};

AspectDropdown.propTypes = {
  size: PropTypes.number
};

export default AspectDropdown;
