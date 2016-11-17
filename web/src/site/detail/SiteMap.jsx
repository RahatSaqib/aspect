// Imports from packages
import React, { PropTypes } from 'react'
import { withGoogleMap, GoogleMap, Marker } from 'react-google-maps'

// Render a site position marker in a map
const SiteMap = withGoogleMap(props => (
  <GoogleMap
    defaultZoom={14}
    center={props.position}
    options={{ scrollwheel: false }}
  >
    <Marker
      position={props.position}
    />
  </GoogleMap>
))

SiteMap.defaultProps = {
  // properties required by react-google-maps
  containerElement: <div style={{ height: '100%' }} />,
  mapElement: <div style={{ height: '100%' }} />
}

SiteMap.propTypes = {
  position: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired
  }).isRequired
}

export default SiteMap
