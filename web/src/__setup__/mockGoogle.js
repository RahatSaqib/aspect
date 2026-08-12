/* eslint-disable max-classes-per-file */
// modified from https://github.com/hibiken/react-places-autocomplete/issues/189

const google = {
  maps: {
    LatLngBounds: class {},
    Marker: class {
      setPosition() {}

      setOptions() {}

      setMap() {}
    },
    MarkerClusterer: class {},
    Map: class {
      setTilt() {}

      fitBounds() {}

      setCenter() {}

      setZoom() {}

      setOptions() {}
    },
    event: {
      addListener: () => ({ remove() {} }),
      removeListener: listener => listener && listener.remove && listener.remove(),
      clearInstanceListeners: () => {},
    },
    places: {
      Autocomplete: class {},
      AutocompleteService: class {},
      PlacesAutocomplete: {
        INVALID_REQUEST: 'INVALID_REQUEST',
        NOT_FOUND: 'NOT_FOUND',
        OK: 'OK',
        OVER_QUERY_LIMIT: 'OVER_QUERY_LIMIT',
        REQUEST_DENIED: 'REQUEST_DENIED',
        UNKNOWN_ERROR: 'UNKNOWN_ERROR',
        ZERO_RESULTS: 'ZERO_RESULTS',
      },
      PlacesServiceStatus: {
        INVALID_REQUEST: 'INVALID_REQUEST',
        NOT_FOUND: 'NOT_FOUND',
        OK: 'OK',
        OVER_QUERY_LIMIT: 'OVER_QUERY_LIMIT',
        REQUEST_DENIED: 'REQUEST_DENIED',
        UNKNOWN_ERROR: 'UNKNOWN_ERROR',
        ZERO_RESULTS: 'ZERO_RESULTS',
      },
    },
    Geocoder: class {},
    GeocoderStatus: {
      ERROR: 'ERROR',
      INVALID_REQUEST: 'INVALID_REQUEST',
      OK: 'OK',
      OVER_QUERY_LIMIT: 'OVER_QUERY_LIMIT',
      REQUEST_DENIED: 'REQUEST_DENIED',
      UNKNOWN_ERROR: 'UNKNOWN_ERROR',
      ZERO_RESULTS: 'ZERO_RESULTS',
    },
  },
}

global.window.google = google
