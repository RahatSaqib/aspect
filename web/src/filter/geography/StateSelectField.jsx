import _ from 'lodash'
import Immutable from 'immutable'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import MenuItem from '@material-ui/core/MenuItem'

import { fetchStatesForLocationSelector } from '../../geography/GeographyRedux'
import SelectField from '../../components/shared/SelectField'

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
    onStateIdChange: PropTypes.func.isRequired,
    countryId: PropTypes.string, // eslint-disable-line react/no-unused-prop-types
    stateId: PropTypes.string,
  }

  static defaultProps = {
    allItemText: 'All',
    countryId: '',
    stateId: '',
  }

  componentDidMount() {
    const selectedCountry = getSelectedCountry(this.props)
    if (selectedCountry) {
      this.props.fetchStatesForLocationSelector(selectedCountry)
    }
  }

  componentDidUpdate(prevProps) {
    const prevSelectedCountry = getSelectedCountry(prevProps)
    const selectedCountry = getSelectedCountry(this.props)
    if (
      selectedCountry &&
      (!prevSelectedCountry ||
        prevSelectedCountry.get('id') !== selectedCountry.get('id'))
    ) {
      this.props.fetchStatesForLocationSelector(selectedCountry)
    }
  }

  handleSelectFieldChange = ({ target: { value } }) => {
    this.props.onStateIdChange(value === 'all' ? undefined : value)
  }

  render() {
    const { allItemText, stateId } = this.props
    const restProps = _.omit(this.props, [
      'allItemText',
      'countries',
      'onStateIdChange',
      'countryId',
      'stateId',
      'fetchStatesForLocationSelector',
    ])

    return (
      <SelectField
        {...restProps}
        value={stateId}
        onChange={this.handleSelectFieldChange}
      >
        {allItemText && <MenuItem value="all">{allItemText}</MenuItem>}
        {getSelectedCountryStates(this.props).map(s => (
          <MenuItem key={s.id} value={s.id}>
            {s.name}
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
      fetchStatesForLocationSelector,
    },
    dispatch
  )
}

export default _.flowRight(connect(mapStateToProps, mapDispatchToProps))(
  StateSelectField
)
