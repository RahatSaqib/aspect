import _ from 'lodash'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import MenuItem from '@material-ui/core/MenuItem'

import SelectField from '../../components/shared/SelectField'
import {
  fetchCountriesForLocationSelector,
  LazyLoadItems,
} from '../../geography/GeographyRedux'

export class CountrySelectField extends PureComponent {
  static propTypes = {
    allItemText: PropTypes.string,
    countries: PropTypes.objectOf(LazyLoadItems).isRequired,
    fetchCountriesForLocationSelector: PropTypes.func.isRequired,
    onCountryIdChange: PropTypes.func.isRequired,
    countryId: PropTypes.string,
  }

  static defaultProps = {
    allItemText: 'All',
    countryId: '',
  }

  componentDidMount() {
    const { countries } = this.props
    this.props.fetchCountriesForLocationSelector(countries)
  }

  handleSelectFieldChange = ({ target: { value } }) => {
    this.props.onCountryIdChange(value === 'all' ? undefined : value)
  }

  render() {
    const { allItemText, countries, countryId, ...others } = this.props

    const restProps = _.omit(others, [
      'onCountryIdChange',
      'fetchCountriesForLocationSelector',
    ])

    return (
      <SelectField
        {...restProps}
        value={countryId}
        onChange={this.handleSelectFieldChange}
      >
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

export default _.flowRight(connect(mapStateToProps, mapDispatchToProps))(
  CountrySelectField
)
