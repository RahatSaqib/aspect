import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import MenuItem from 'material-ui/MenuItem'

import { fetchCountriesForLocationSelector } from '../../geography/GeographyRedux'
import ForkedSelectField from '../../components/forkedMaterialUi/ForkedSelectField'

class CountrySelectField extends PureComponent {
  static propTypes = {
    countries: PropTypes.object.isRequired,
    fetchCountriesForLocationSelector: PropTypes.func.isRequired,
    onChangeCountry: PropTypes.func.isRequired,
    countryId: PropTypes.string
  }

  handleSelectFieldChange = (event, index, value) => {
    this.props.onChangeCountry(value)
  }

  componentDidMount() {
    const {countries, countryId} = this.props
    this.props.fetchCountriesForLocationSelector(false, countries, countryId, null)
  }

  render() {
    const {countries, countryId} = this.props
    const restProps = _.omit(this.props, [
      'countries', 'onChangeCountry', 'countryId', 'fetchCountriesForLocationSelector'
    ])

    return (
      <ForkedSelectField
        {...restProps}
        value={countryId}
        onChange={this.handleSelectFieldChange}
      >
        {countries.items.map(c => (
          <MenuItem
            key={c.id}
            value={c.id}
            primaryText={c.name}
          />
        ))}
      </ForkedSelectField>
    )
  }
}

function mapStateToProps(state) {
  return {
    countries: state.geography.countriesForLocationSelector
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    fetchCountriesForLocationSelector
  }, dispatch)
}

export default _.flowRight(
  connect(mapStateToProps, mapDispatchToProps)
)(CountrySelectField)
