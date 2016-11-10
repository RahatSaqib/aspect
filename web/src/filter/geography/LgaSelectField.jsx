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
  return states.find((s) => s.id === props.stateId)
}

export function getSelectedStateLgas(props) {
  const selectedState = getSelectedState(props)
  if (selectedState && selectedState.children.items) {
    return selectedState.children.items
  } else {
    return Immutable.List()
  }
}

class LgaSelectField extends PureComponent {
  static propTypes = {
    countries: PropTypes.object.isRequired,
    onChangeLga: PropTypes.func.isRequired,
    countryId: PropTypes.string,
    stateId: PropTypes.string,
    lgaId: PropTypes.string
  }

  handleSelectFieldChange = (event, index, value) => {
    this.props.onChangeLga(value)
  }

  componentDidMount() {
    const selectedCountry = getSelectedCountry(this.props)
    const selectedState = getSelectedState(this.props)
    if (selectedState) {
      this.props.fetchLgasForLocationSelector(true, selectedCountry, selectedState)
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.stateId !== prevProps.stateId) {
      const selectedCountry = getSelectedCountry(this.props)
      const selectedState = getSelectedState(this.props)
      if (selectedState) {
        this.props.fetchLgasForLocationSelector(true, selectedCountry, selectedState)
      }
    }
  }

  render() {
    const {lgaId} = this.props
    const restProps = _.omit(this.props, [
      'countries', 'onChangeLga', 'countryId', 'stateId', 'lgaId', 'fetchLgasForLocationSelector'
    ])

    return (
      <ForkedSelectField
        {...restProps}
        value={lgaId}
        onChange={this.handleSelectFieldChange}
      >
        {getSelectedStateLgas(this.props).map(l => (
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
