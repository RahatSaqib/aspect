import React from 'react'
import {
  array,
  bool,
  func,
  number,
  object,
  shape,
  string,
  oneOfType,
} from 'prop-types'
import { GoogleMap } from '@react-google-maps/api'
import noop from 'lodash/noop'

import GooglePin from './Markers/GooglePin'

/**
 * Adds AspectMaps as a Google Maps component
 */

const AspectMap = ({
  config: { containerStyle, fitMarkers, markers: markersConfig, options, zoom },
}) => {
  const { data } = markersConfig
  const fitBounds = map => {
    const bounds = new window.google.maps.LatLngBounds()
    data.map(({ lat, lng }) => bounds.extend({ lat, lng }))
    map.fitBounds(bounds)
  }

  const loadHandler = map => {
    fitBounds(map)
  }

  return (
    <GoogleMap
      center={data[0]}
      onLoad={fitMarkers ? loadHandler : noop}
      options={options}
      mapContainerStyle={containerStyle}
      zoom={zoom}
    >
      {data?.map(({ lat, lng, color, id, maintenanceStatusName, name }) => (
        <GooglePin
          id={id}
          key={id}
          position={{ lat, lng }}
          config={markersConfig}
          color={color}
          info={{ maintenanceStatusName, name }}
        />
      ))}
    </GoogleMap>
  )
}

const containerStyle = {
  width: string.isRequired,
  height: string.isRequired,
}

const markers = {
  size: number,
  click: func,
  data: oneOfType([array]),
}

AspectMap.defaultProps = {
  config: {
    containerStyle: { height: '100px', width: '100px' },
    fitMarkers: false,
    markers: {},
    zoom: 15,
    options: {},
  },
}

AspectMap.propTypes = {
  config: {
    containerStyle: shape(containerStyle),
    fitMarkers: bool,
    markers: shape(markers),
    options: oneOfType([object]),
    zoom: number,
  },
}

export default React.memo(AspectMap)
