import _ from 'lodash'
import Immutable from 'immutable'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import MenuItem from '@material-ui/core/MenuItem'

import { fetchSitesForLocationSelector } from '../../geography/GeographyRedux'
import { getSelectedCountry } from './StateSelectField'
import { getSelectedState, getSelectedStateLgas } from './LgaSelectField'
import SelectField from '../../components/shared/SelectField'

export function getSelectedLga(props) {
  const lgas = getSelectedStateLgas(props)
  if (lgas.loading || lgas.items.isEmpty()) {
    return undefined
  }
  return lgas.items.find(s => +s.id === +props.lgaId)
}
export function getSelectedLgaSites(props) {
  const selectedLga = getSelectedLga(props)
  if (selectedLga && selectedLga.children) {
    return selectedLga.children
  }
  return {
    loading: false,
    items: Immutable.List(),
  }
}

export class SiteSelectField extends PureComponent {
  static propTypes = {
    allItemText: PropTypes.string,
    onSiteIdChange: PropTypes.func.isRequired,
    stateId: PropTypes.string, // eslint-disable-line react/no-unused-prop-types
    lgaId: PropTypes.string,
    siteId: PropTypes.string,
    fetchSitesForLocationSelector: PropTypes.func,
  }

  static defaultProps = {
    allItemText: 'All',
    stateId: '',
    lgaId: '',
    siteId: '',
    fetchSitesForLocationSelector: undefined,
  }

  componentDidMount() {
    const selectedCountry = getSelectedCountry(this.props)
    const selectedState = getSelectedState(this.props)
    const selectedLga = getSelectedLga(this.props)
    if (selectedLga) {
      this.props.fetchSitesForLocationSelector(
        selectedCountry,
        selectedState,
        selectedLga
      )
    }
  }

  componentDidUpdate(prevProps) {
    const prevSelectedLga = getSelectedLga(prevProps)
    const selectedLga = getSelectedLga(this.props)
    if (
      selectedLga &&
      (!prevSelectedLga || prevSelectedLga.get('id') !== selectedLga.get('id'))
    ) {
      const selectedCountry = getSelectedCountry(this.props)
      const selectedState = getSelectedState(this.props)
      this.props.fetchSitesForLocationSelector(
        selectedCountry,
        selectedState,
        selectedLga
      )
    }
  }

  handleSelectFieldChange = ({ target: { value } }) => {
    this.props.onSiteIdChange(value === 'all' ? undefined : value)
  }

  render() {
    const { allItemText, siteId } = this.props
    const restProps = _.omit(this.props, [
      'allItemText',
      'countries',
      'onSiteIdChange',
      'countryId',
      'stateId',
      'lgaId',
      'siteId',
      'fetchSitesForLocationSelector',
    ])
    const sites = getSelectedLgaSites(this.props)

    return (
      <SelectField
        {...restProps}
        disabled={sites.loading || sites.items.isEmpty()}
        value={siteId}
        onChange={this.handleSelectFieldChange}
      >
        {allItemText && <MenuItem value="all">{allItemText}</MenuItem>}
        {sites.items.map(c => (
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
      fetchSitesForLocationSelector,
    },
    dispatch
  )
}

export default _.flowRight(connect(mapStateToProps, mapDispatchToProps))(
  SiteSelectField
)
