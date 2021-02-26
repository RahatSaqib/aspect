import React from 'react'
import { func, shape, string, number } from 'prop-types'
import { OverlayView } from '@react-google-maps/api'
import classnames from 'classnames/bind'

import IconProvider from '../../../IconProvider'

const cssClasses = classnames.bind(require('./GooglePin.css'))

const GooglePin = ({ position, config, id, color }) => {
  const { size, click } = config
  return (
    <OverlayView
      position={position}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <div
        key={id}
        className={cssClasses('markers--google-pin')}
        onClick={click}
        onKeyDown={() => false}
        role="button"
        tabIndex={id}
        style={{
          top: `-${size}px`,
          left: `-${size / 2}px`,
          fontSize: `${size}px`,
          color,
        }}
      >
        <IconProvider icon="FaMapMarkerAlt" />
      </div>
    </OverlayView>
  )
}

GooglePin.defaultProps = {
  id: 0,
  color: 'transparent',
}

const configShape = {
  size: number,
  click: func,
}

const positionShape = { lat: number.isRequired, lng: number.isRequired }

GooglePin.propTypes = {
  position: shape(positionShape).isRequired,
  config: shape(configShape).isRequired,
  color: string,
  id: number,
}

export default GooglePin
