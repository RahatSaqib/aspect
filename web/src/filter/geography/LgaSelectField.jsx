import _ from 'lodash'
import Immutable from 'immutable'
import React, { PureComponent, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import MenuItem from 'material-ui/MenuItem'

import { fetchLgasForLocationSelector } from '../../geography/GeographyRedux'
import ForkedSelectField from '../../components/forkedMaterialUi/ForkedSelectField'
import {
  getSelectedCountry,
  getSelectedCountryStates
} from './StateSelectField'

export function getSelectedState(props) {
  const states = getSelectedCountryStates(props)
  return states.find(s => s.id === props.stateId)
}

export function getSelectedStateLgas(props) {
  const selectedState = getSelectedState(props)
  if (selectedState && selectedState.children) {
    return selectedState.children
  }
  return {
    loading: false,
    items: Immutable.List(),
  }
}

export class LgaSelectField extends PureComponent {
  static propTypes = {
    allItemText: PropTypes.string,
    onChangeLga: PropTypes.func.isRequired,
    stateId: PropTypes.string, // eslint-disable-line react/no-unused-prop-types
    lgaId: PropTypes.string,
    fetchLgasForLocationSelector: PropTypes.func
  }

  static defaultProps = {
    allItemText: 'All',
    stateId: '',
    lgaId: '',
    fetchLgasForLocationSelector: undefined
  }

  componentDidMount() {
    const selectedCountry = getSelectedCountry(this.props)
    const selectedState = getSelectedState(this.props)
    if (selectedState) {
      this.props.fetchLgasForLocationSelector(false, selectedCountry, selectedState)
    }
  }

  componentDidUpdate(prevProps) {
    const prevSelectedState = getSelectedState(prevProps)
    const selectedState = getSelectedState(this.props)
    if (selectedState && (
      !prevSelectedState || prevSelectedState.get('id') !== selectedState.get('id')
    )) {
      const selectedCountry = getSelectedCountry(this.props)
      this.props.fetchLgasForLocationSelector(false, selectedCountry, selectedState)
    }
  }

  handleSelectFieldChange = (event, index, value) => {
    this.props.onChangeLga(index === 0 ? undefined : value)
  }

  render() {
    const { allItemText, lgaId } = this.props
    const restProps = _.omit(this.props, [
      'allItemText', 'countries', 'onChangeLga', 'countryId', 'stateId', 'lgaId', 'fetchLgasForLocationSelector'
    ])
    const lgas = getSelectedStateLgas(this.props)

    return (
      <ForkedSelectField
        {...restProps}
        disabled={lgas.loading || lgas.items.isEmpty()}
        value={lgaId}
        onChange={this.handleSelectFieldChange}
      >
        {allItemText && (
          <MenuItem
            value="all"
            primaryText={allItemText}
          />
        )}
        {lgas.items.map(l => (
          <MenuItem
            key={l.id}
            value={l.id}
            primaryText={l.name}
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
    fetchLgasForLocationSelector
  }, dispatch)
}

export default _.flowRight(
  connect(mapStateToProps, mapDispatchToProps)
)(LgaSelectField)
