/* global google */
import isNumber from 'lodash/isNumber'
import isString from 'lodash/isString'
import some from 'lodash/some'

let geocoder = null
function getGeoCoder() {
  if (!geocoder) {
    try {
      geocoder = new google.maps.Geocoder()
    } catch {} // eslint-disable-line no-empty
  }
  return geocoder
}

export function isValidLatLng({ lat, lng }) {
  return isNumber(lat) && isNumber(lng)
}

export function isValidFullAddress({ country, state, lga, city, address, address2 }) {
  return some([country, state, lga, city, address, address2], isString)
}

export function formatFullAddressToAddressQuery({ country, state, lga, city, address }) {
  return `${address}, ${city}, ${lga}, ${state}, ${country}`
}

export function getLatLongFromAddress(address) {
  return new Promise((resolve, reject) => {
    if (!isValidFullAddress(address)) {
      return reject(new Error('invalid address'))
    }
    const geocoder = getGeoCoder()
    if (!geocoder) {
      return reject(new Error('Can not create Geocoder instance'))
    }

    const addressQuery = formatFullAddressToAddressQuery(address)
    const handler = ({ geometry: { location } }) =>
      resolve({
        lat: location.lat(),
        lng: location.lng(),
      })

    geocoder.geocode({ address: addressQuery }, (results, status) => {
      if (status !== google.maps.GeocoderStatus.OK) {
        return reject(new Error('bad geocoder status'))
      }
      handler(results[0])
    })
  })
}

export const convertToFloat = (doubleNum, decimals = 6) => {
  const base = 10 ** decimals
  return Math.round(Math.fround(Number(doubleNum)) * base) / base
}
