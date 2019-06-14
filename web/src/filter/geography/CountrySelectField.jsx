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
    countries: PropTypes.objectOf(LazyLoadItems).isRequired,
    fetchCountriesForLocationSelector: PropTypes.func.isRequired,
    onCountryIdChange: PropTypes.func.isRequired,
    countryId: PropTypes.string,
  }

  static defaultProps = {
    countryId: '',
  }

  state = {
    checkNoOfListedCountry: '',
  }

  componentDidMount() {
    const { countries } = this.props
    let checkNoOfListedCountry = ''

    if (countries.items.size === 1) {
      countries.items.map(country => {
        checkNoOfListedCountry = country.id
        this.setState({ checkNoOfListedCountry: country.id })
        return country.id
      })
      if (this.props.onCountryIdChange && checkNoOfListedCountry) {
        this.props.onCountryIdChange(checkNoOfListedCountry)
      }
    }
    this.props.fetchCountriesForLocationSelector(countries)
  }

  handleSelectFieldChange = ({ target: { value } }) => {
    this.props.onCountryIdChange(value === 'all' ? undefined : value)
  }

  render() {
    const { countries, countryId, ...others } = this.props

    const restProps = _.omit(others, [
      'onCountryIdChange',
      'fetchCountriesForLocationSelector',
    ])

    return (
      <SelectField
        {...restProps}
        value={this.state.checkNoOfListedCountry || countryId}
        onChange={this.handleSelectFieldChange}
      >
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
