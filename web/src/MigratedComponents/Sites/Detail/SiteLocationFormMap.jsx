/* global google */
// Imports from packages
import { defineMessages, injectIntl } from 'react-intl'
import flowRight from 'lodash/flowRight'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { reduxForm, formValueSelector } from 'redux-form/immutable'
import { connect } from 'react-redux'
import CircularProgress from '@material-ui/core/CircularProgress'

import { latLng, address } from '../../../shared/selectors/site'
import { isValidLatLng, isValidFullAddress, formatFullAddressToAddressQuery } from '../../../site/utils/address'
import SiteMap from './SiteMap'
import styles from './SiteLocationFormMap.css'
import PropTypeOf from '../../../shared/types'

const messages = defineMessages({
  findingLocation: {
    id: 'pages.SiteLocationFormMap.findingLocation',
    defaultMessage: 'Finding Location',
  },
})

/*
 * This component deals with four location values:
 *   1. latLng pair in 'siteDetail' form state
 *   2. latLng pair in site object from API response
 *   3. full address object in 'siteDetail' form state
 *   4. full address object in site object from API response
 * It finds the location in order and display it in the Map component.
 * If no latLng pair is found, it utilize Geocoder to decode full address object
 * into a latLng pair.
 */

export class SiteLocationFormMap extends PureComponent {
  geocoder = new google.maps.Geocoder()

  isUnmounted = false

  static propTypes = {
    change: PropTypes.func.isRequired, // redux-form
    // fullAddressInForm: PropTypes.shape({
    //   country: PropTypes.string.isRequired,
    //   state: PropTypes.string.isRequired,
    //   lga: PropTypes.string,
    //   city: PropTypes.string,
    //   address: PropTypes.string.isRequired,
    //   address2: PropTypes.string,
    // }).isRequired, // connect
    editable: PropTypes.bool,
    intl: PropTypeOf.intl.isRequired,
  }

  static defaultProps = {
    editable: false,
  }

  constructor(props) {
    super(props)
    if (!this.getValidLatLng(props)) {
      this.handleQueryAddress(props)
    }
  }

  // query geocoder again if no valid latLng in nextProps or
  // the use just changed some field of address part in the form
  componentDidUpdate() {
    const noValidLatLng = !this.getValidLatLng(this.props)

    if (noValidLatLng) {
      this.handleQueryAddress(this.props)
    }
  }

  componentWillUnmount() {
    this.isUnmounted = true
  }

  // read lat, lng from form state first, otherwise use the site values from API
  // eslint-disable-next-line react/sort-comp
  getValidLatLng({ latLngInForm, latLngInSite }) {
    if (isValidLatLng(latLngInForm)) {
      return latLngInForm
    }
    if (isValidLatLng(latLngInSite)) {
      return latLngInSite
    }
    return false
  }

  // update form state with new location
  handlePositionFound({ geometry: { location } }) {
    const { editable, change } = this.props
    if (editable) {
      change('latitude', location.lat())
      change('longitude', location.lng())
    }
  }

  handleQueryAddress({ fullAddressInForm, fullAddressInSite }) {
    const fullAddress = isValidFullAddress(fullAddressInForm) ? fullAddressInForm : fullAddressInSite
    const addressQuery = formatFullAddressToAddressQuery(fullAddress)

    this.geocoder.geocode(
      {
        address: addressQuery,
      },
      (results, status) => {
        if (this.isUnmounted) {
          return
        }
        if (status !== google.maps.GeocoderStatus.OK) {
          return
        }
        this.handlePositionFound(results[0])
      }
    )
  }

  render() {
    const latLng = this.getValidLatLng(this.props)
    const { intl } = this.props
    return (
      <div className={styles.Container}>
        {latLng ? (
          <SiteMap position={latLng} />
        ) : (
          <div>
            <p>{intl.formatMessage(messages.findingLocation)}</p>
            <CircularProgress />
          </div>
        )}
      </div>
    )
  }
}

function validate() {
  const errors = {}
  return errors
}

const selector = formValueSelector('siteDetail')

function mapStateToProps(state, props) {
  const latLngInForm = selector(state, 'lat', 'lng')
  const latLngInSite = latLng(props.site)
  const fullAddressInForm = selector(state, 'country', 'state', 'lga', 'city', 'address', 'address2')
  const fullAddressInSite = address(props.site)

  return {
    latLngInForm,
    latLngInSite,
    fullAddressInSite,
    fullAddressInForm,
  }
}

export const SiteLocationFormMapContainer = flowRight(
  injectIntl,
  reduxForm({
    form: 'siteDetail',
    validate,
  }),
  connect(mapStateToProps)
)(SiteLocationFormMap)

export default SiteLocationFormMapContainer
