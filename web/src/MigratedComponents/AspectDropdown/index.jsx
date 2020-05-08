import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import classnames from 'classnames/bind';
import Grid from '@material-ui/core/Grid';
import Select from 'react-select';
import get from 'lodash/get';

import usePrevious from '../../Hooks/CustomHooks';
import { fetchClinicalIndicatorsDashboard } from '../Graphs/Helpers/Redux/';

const cssClasses = classnames.bind(require('./AspectDropdown.css'));

const {
  '--aspect-color-chill-blue-1': aspectChillBlue1,
  '--aspect-color-chill-blue-3': aspectChillBlue3,
  '--aspect-color-white': aspectWhite,
  '--white-lilac-2': lilac2
} = process.env;

const buildCustomStyles = defaultOption => {
  const styles = {
    option: (provided, state) => {
      const { isSelected, isFocused } = state;
      return {
        ...provided,
        color: isSelected ? aspectWhite : aspectChillBlue1,
        backgroundColor:
          (isSelected && aspectChillBlue3) || (isFocused && lilac2)
      };
    },
    control: provided => ({
      ...provided,
      width: 200,
      backgroundColor: aspectChillBlue1,
      display: 'flex',
      borderRadius: '5px',
      padding: '0 8px 0',
      margin: '0 0 0 5px'
    }),
    placeholder: provided => ({
      ...provided,
      color: aspectWhite
    }),
    clearIndicator: provided => ({
      ...provided,
      ':hover': aspectWhite,
      color: aspectWhite
    }),
    dropdownIndicator: (provided, state) => ({
      ...provided,
      ':hover': aspectWhite,
      color: aspectWhite,
      padding: '8px 0 8px 8px'
    }),
    input: provided => ({
      ...provided,
      color: aspectWhite
    }),
    singleValue: (provided, state) => ({
      ...provided,
      color: aspectWhite
    })
  };

  return styles;
};

const AspectDropdown = ({
  selectedValue,
  reduxStateId,
  data: passedData = false
}) => {
  const dispatch = useDispatch();
  const [defaultOption, setDefaultOption] = useState(selectedValue);
  const [inputValue, setInputValue] = useState(false);
  const prevInputValue = usePrevious(inputValue);
  const [data, setData] = useState(false);
  const reduxData = passedData
    ? passedData
    : useSelector(state => get(state.toJS(), reduxStateId));

  useEffect(() => {
    if (!data) {
      setData(reduxData);
    }
  }, [reduxData]);

  useEffect(() => {
    if (inputValue && inputValue !== prevInputValue) {
      console.log(inputValue);

      const parentId = 'treatmentStatus';
      const id = 'treatmentStatusMonthly';
      const whiteListed = ['GxHiv1Vl'];
      const api = {
        method: 'POST',
        endpoint: 'result/confirmed-treatment-tracking',
        params: {
          siteId: null,
          endedOn: '2020-04-30',
          assayTypeId: null,
          resultCategoryId: null
        }
      };
      const title = '';

      console.log(parentId, id, whiteListed, api, title);

      dispatch(
        fetchClinicalIndicatorsDashboard({
          parentId,
          id,
          whiteListed,
          api,
          title
        })
      );
    }
  }, [inputValue]);

  return data && data.length ? (
    <Select
      getOptionLabel={option => option.name}
      getOptionValue={option => option.id}
      isClearable
      options={data}
      placeholder={defaultOption}
      styles={buildCustomStyles(defaultOption)}
      onChange={v => setInputValue(v)}
    />
  ) : null;
};

AspectDropdown.defaultProps = {};
AspectDropdown.propTypes = {};

export default AspectDropdown;
