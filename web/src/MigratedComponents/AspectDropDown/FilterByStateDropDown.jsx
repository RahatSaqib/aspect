import React, { useEffect, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { oneOfType, object } from 'prop-types'
import Select from 'react-select'
import useI18n from '../../Hooks/i18n/useI18n'
import { getAspectTheme } from './index.jsx'
import { useAuthState } from '../../Providers/AuthProvider'
import {
  fetchCountries,
  fetchStatesForCountry,
} from '../../geography/GeographyRedux'
import messages from './messages'
import ClearIndicator from './ClearIndicator'

const getCountry = (geographyComposed, countryId) =>
  geographyComposed
    .getIn(['countriesForLocationSelector', 'items'])
    .find(country => +country.get('id') === +countryId)
const getStates = countryComposed => {
  if (countryComposed?.getIn(['children', 'lastRefreshed'])) {
    return countryComposed
      .getIn(['children', 'items'])
      .toJS()
      .map(({ id, name }) => ({
        value: id,
        label: name,
      }))
  }
  return null
}

const FilterByStateDropDown = props => {
  const { formatMessage } = useI18n()
  const dispatch = useDispatch()

  const auth = useAuthState()
  const { countryId } = auth

  /**
   * 1 - get composed geography/country from the store
   */
  const geographyComposed = useSelector(({ geography }) => geography)
  const countryComposed = useMemo(
    () => getCountry(geographyComposed, countryId),
    [geographyComposed, countryId]
  )
  /**
   * 2 - get and memoize states from current country object
   */
  const states = useMemo(() => getStates(countryComposed), [countryComposed])
  /**
   * 3.1 - load countries if they are missing in the store
   */
  useEffect(() => {
    if (!countryComposed) {
      dispatch(fetchCountries())
    }
  }, [dispatch, countryComposed])
  /**
   * 3.2 - load states if they are missing in the store
   */
  useEffect(() => {
    if (countryComposed && !states) {
      const countryId = countryComposed.get('id')
      const countryName = countryComposed.get('name')
      dispatch(fetchStatesForCountry(countryId, countryName, false))
    }
  }, [dispatch, countryComposed, states])

  const {
    props: { actionComponentProps: config, action },
  } = props
  const { selectorModifiers } = config
  const { identifier, isClearable, isSearchable } =
    selectorModifiers[0] || false

  const handleChange = (val, type) => {
    const { action: selectAction } = type
    return action({ val, selectAction })
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: '20px',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '450px',
          zIndex: 99,
        }}
      >
        <Select
          autoBlur
          placeholder={formatMessage(messages.selectState)}
          className="basic-single"
          classNamePrefix="select"
          hideSelectedOptions={false}
          isLoading={!states}
          isClearable={isClearable}
          isSearchable={isSearchable}
          onChange={handleChange}
          name={identifier}
          options={states}
          styles={getAspectTheme()}
          components={{ ClearIndicator }}
        />
      </div>
    </div>
  )
}

FilterByStateDropDown.propTypes = {
  props: oneOfType([object]).isRequired,
}

export default FilterByStateDropDown
