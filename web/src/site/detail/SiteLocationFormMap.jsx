/* global google */
// Imports from packages
import _ from 'lodash'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { reduxForm, formValueSelector } from 'redux-form/immutable'
import { connect } from 'react-redux'
import CircularProgress from 'material-ui/CircularProgress'

import { latLng, address } from '../../shared/selectors/site'
import SiteMap from './SiteMap'
import styles from './SiteLocationFormMap.css'

function isValidLatLng({ lat, lng }) {
  return _.isNumber(lat) && _.isNumber(lng)
}

function isValidFullAddress({ country, state, lga, city, address, address2 }) {
  return _.some([country, state, lga, city, address, address2], _.isString)
}

function formatFullAddressToAddressQuery({
  country,
  state,
  lga,
  city,
  address,
}) {
  return `${address}, ${city}, ${lga}, ${state}, ${country}`
}

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
  static propTypes = {
    change: PropTypes.func.isRequired, // redux-form
    fullAddressInForm: PropTypes.shape({
      country: PropTypes.string.isRequired,
      state: PropTypes.string.isRequired,
      lga: PropTypes.string,
      city: PropTypes.string,
      address: PropTypes.string.isRequired,
      address2: PropTypes.string,
    }).isRequired, // connect
    editable: PropTypes.bool.isRequired,
  }

  componentWillMount() {
    if (!this.getValidLatLng(this.props)) {
      this.handleQueryAddress(this.props)
    }
  }

  // query geocoder again if no valid latLng in nextProps or
  // the use just changed some field of address part in the form
  componentWillReceiveProps(nextProps) {
    const noValidLatLng = !this.getValidLatLng(nextProps)
    const isAddressInFormJustChanged = !_.isEqual(
      this.props.fullAddressInForm,
      nextProps.fullAddressInForm
    )

    if (noValidLatLng || isAddressInFormJustChanged) {
      this.handleQueryAddress(nextProps)
    }
  }

  componentWillUnmount() {
    this.isUnmounted = true
  }

  // read lat, lng from form state first, otherwise use the site values from API
  getValidLatLng({ latLngInForm, latLngInSite }) {
    if (isValidLatLng(latLngInForm)) {
      return latLngInForm
    } else if (isValidLatLng(latLngInSite)) {
      return latLngInSite
    }
    return false
  }

  // update form state with new location
  handlePositionFound({ geometry: { location } }) {
    const { editable, change } = this.props
    if (editable) {
      change('lat', location.lat())
      change('lng', location.lng())
    }
  }

  handleQueryAddress({ fullAddressInForm, fullAddressInSite }) {
    const fullAddress = isValidFullAddress(fullAddressInForm)
      ? fullAddressInForm
      : fullAddressInSite
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

  geocoder = new google.maps.Geocoder()

  isUnmounted = false

  render() {
    const latLng = this.getValidLatLng(this.props)

    return (
      <div className={styles.Container}>
        {latLng
          ? <SiteMap position={latLng} />
          : <div>
              <p>Finding location</p>
              <CircularProgress size={2} />
            </div>}
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
  const fullAddressInForm = selector(
    state,
    'country',
    'state',
    'lga',
    'city',
    'address',
    'address2'
  )
  const fullAddressInSite = address(props.site)

  return {
    latLngInForm,
    latLngInSite,
    fullAddressInSite,
    fullAddressInForm,
  }
}

export const SiteLocationFormMapContainer = _.flowRight(
  reduxForm({
    form: 'siteDetail',
    validate,
  }),
  connect(mapStateToProps)
)(SiteLocationFormMap)

export default SiteLocationFormMapContainer
