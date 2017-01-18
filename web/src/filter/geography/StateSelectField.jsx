import _ from 'lodash'
import Immutable from 'immutable'
import React, { PureComponent, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import MenuItem from 'material-ui/MenuItem'

import { fetchStatesForLocationSelector } from '../../geography/GeographyRedux'
import ForkedSelectField from '../../components/forkedMaterialUi/ForkedSelectField'

export function getSelectedCountry({ countries, countryId }) {
  if (countries.loading) {
    return
  }
  if (!countryId) {
    return
  }
  return countries.items.find(c => c.id === countryId)
}

export function getSelectedCountryStates(props) {
  const selectedCountry = getSelectedCountry(props)
  if (selectedCountry && selectedCountry.children.items) {
    return selectedCountry.children.items
  }
  return Immutable.List()
}

export class StateSelectField extends PureComponent {
  static propTypes = {
    allItemText: PropTypes.string,
    fetchStatesForLocationSelector: PropTypes.func.isRequired,
    onChangeState: PropTypes.func.isRequired,
    countryId: PropTypes.string, // eslint-disable-line react/no-unused-prop-types
    stateId: PropTypes.string
  }

  componentDidMount() {
    const selectedCountry = getSelectedCountry(this.props)
    if (selectedCountry) {
      this.props.fetchStatesForLocationSelector(false, selectedCountry)
    }
  }

  componentDidUpdate(prevProps) {
    const prevSelectedCountry = getSelectedCountry(prevProps)
    const selectedCountry = getSelectedCountry(this.props)
    if (selectedCountry && (
      !prevSelectedCountry || prevSelectedCountry.get('id') !== selectedCountry.get('id')
    )) {
      this.props.fetchStatesForLocationSelector(false, selectedCountry)
    }
  }

  handleSelectFieldChange = (event, index, value) => {
    this.props.onChangeState(index === 0 ? undefined : value)
  }

  render() {
    const { allItemText, stateId } = this.props
    const restProps = _.omit(this.props, [
      'allItemText', 'countries', 'onChangeState', 'countryId', 'stateId', 'fetchStatesForLocationSelector'
    ])

    return (
      <ForkedSelectField
        {...restProps}
        value={stateId}
        onChange={this.handleSelectFieldChange}
      >
        {allItemText && (
          <MenuItem
            value="all"
            primaryText={allItemText}
          />
        )}
        {getSelectedCountryStates(this.props).map(s => (
          <MenuItem
            key={s.id}
            value={s.id}
            primaryText={s.name}
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
    fetchStatesForLocationSelector
  }, dispatch)
}

export default _.flowRight(
  connect(mapStateToProps, mapDispatchToProps)
)(StateSelectField)
