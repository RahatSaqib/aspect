/* global google */
import _ from 'lodash'

const geocoder = new google.maps.Geocoder()

export function isValidLatLng({ lat, lng }) {
  return _.isNumber(lat) && _.isNumber(lng)
}

export function isValidFullAddress({
  country,
  state,
  lga,
  city,
  address,
  address2,
}) {
  return _.some([country, state, lga, city, address, address2], _.isString)
}

export function formatFullAddressToAddressQuery({
  country,
  state,
  lga,
  city,
  address,
}) {
  return `${address}, ${city}, ${lga}, ${state}, ${country}`
}

export function getLatLongFromAddress(address) {
  return new Promise((resolve, reject) => {
    if (!isValidFullAddress(address)) {
      return reject(new Error('invalid address'))
    }

    const addressQuery = formatFullAddressToAddressQuery(address)
    const handler = ({ geometry: { location } }) =>
      resolve({
        lat: location.lat(),
        lng: location.lng(),
      })

    window.addEventListener(
      'keyup',
      _.debounce(
        () =>
          geocoder.geocode(
            {
              address: addressQuery,
            },
            (results, status) => {
              if (status !== google.maps.GeocoderStatus.OK) {
                return reject(new Error('bad geocoder status'))
              }
              handler(results[0])
            }
          ),
        1000
      )
    )
  })
}

export const convertToFloat = (doubleNum, decimals = 6) => {
  const base = 10 ** decimals
  return Math.round(Math.fround(Number(doubleNum)) * base) / base
}
