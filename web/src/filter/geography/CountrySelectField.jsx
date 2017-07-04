import _ from 'lodash'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import MenuItem from 'material-ui/MenuItem'

import {
  fetchCountriesForLocationSelector,
  LazyLoadItems,
} from '../../geography/GeographyRedux'
import ForkedSelectField from '../../components/forkedMaterialUi/ForkedSelectField'

export class CountrySelectField extends PureComponent {
  static propTypes = {
    allItemText: PropTypes.string,
    countries: PropTypes.objectOf(LazyLoadItems).isRequired,
    fetchCountriesForLocationSelector: PropTypes.func.isRequired,
    onChangeCountry: PropTypes.func.isRequired,
    countryId: PropTypes.string,
  }

  static defaultProps = {
    allItemText: 'All',
    countryId: '',
  }

  componentDidMount() {
    const { countries, countryId } = this.props
    this.props.fetchCountriesForLocationSelector(
      false,
      countries,
      countryId,
      null
    )
  }

  handleSelectFieldChange = (event, index, value) => {
    this.props.onChangeCountry(value === 'all' ? undefined : value)
  }

  render() {
    const { allItemText, countries, countryId } = this.props
    const restProps = _.omit(this.props, [
      'allItemText',
      'countries',
      'onChangeCountry',
      'countryId',
      'fetchCountriesForLocationSelector',
    ])

    return (
      <ForkedSelectField
        {...restProps}
        value={countryId}
        onChange={this.handleSelectFieldChange}
      >
        {allItemText && <MenuItem value="all" primaryText={allItemText} />}
        {countries.items.map(c =>
          <MenuItem key={c.id} value={c.id} primaryText={c.name} />
        )}
      </ForkedSelectField>
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
