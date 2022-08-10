import flowRight from 'lodash/flowRight'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import MenuItem from '@mui/material/MenuItem'

import SelectField from '../../shared/SelectField'
import { fetchCountriesForLocationSelector, LazyLoadItems } from '../../../store/GeographyRedux'

export class CountrySelectField extends PureComponent {
  static propTypes = {
    allItemText: PropTypes.string,
    countries: PropTypes.objectOf(LazyLoadItems).isRequired,
    fetchCountriesForLocationSelector: PropTypes.func.isRequired,
    onCountryIdChange: PropTypes.func,
    countryId: PropTypes.string,
  }

  static defaultProps = {
    allItemText: 'All',
    countryId: '',
    onCountryIdChange: () => {},
  }

  componentDidMount() {
    const { countries } = this.props
    this.props.fetchCountriesForLocationSelector(countries)
  }

  handleSelectFieldChange = ({ target: { value } }) => {
    this.props.onCountryIdChange(value === 'all' ? undefined : value)
  }

  render() {
    const {
      allItemText,
      countries,
      countryId,
      // to remove from restProps
      onCountryIdChange,
      fetchCountriesForLocationSelector,
      ...restProps
    } = this.props

    return (
      <SelectField {...restProps} value={countryId} onChange={this.handleSelectFieldChange}>
        {allItemText && <MenuItem value="all">{allItemText}</MenuItem>}
        {countries.items.map(c => (
          <MenuItem key={c.id} value={c.id}>
            {c.name}
          </MenuItem>
        ))}
      </SelectField>
    )
  }
}

function mapStateToProps(state) {
  return {
    countries: state.geography.countriesForLocationSelector,
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      fetchCountriesForLocationSelector,
    },
    dispatch
  )
}

export default flowRight(connect(mapStateToProps, mapDispatchToProps))(CountrySelectField)
