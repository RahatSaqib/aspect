import React from 'react'
import { GoogleMap } from '@react-google-maps/api'
import noop from 'lodash/noop'

import GooglePin from './Markers/GooglePin'

function MyComponent({
  config: { containerStyle, fitMarkers, markers: markersConfig, options, zoom },
}) {
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
      {data?.map(({ lat, lng, color }) => (
        <GooglePin
          position={{ lat, lng }}
          config={markersConfig}
          color={color}
        />
      ))}
    </GoogleMap>
  )
}

export default React.memo(MyComponent)
