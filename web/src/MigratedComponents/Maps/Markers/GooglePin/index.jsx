import React from 'react'
import { func, shape, string, number } from 'prop-types'
import { OverlayView } from '@react-google-maps/api'
import classnames from 'classnames/bind'

import IconProvider from '../../../IconProvider'

const cssClasses = classnames.bind(require('./GooglePin.css'))

const GooglePin = ({ position, config, id = 0, color }) => {
  const { size, click } = config
  return (
    <OverlayView
      position={position}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <div
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

GooglePin.propTypes = {
  position: shape({ lat: number.isRequired, lng: number.isRequired })
    .isRequired,
  config: shape({
    size: number,
    click: func,
  }).isRequired,
  color: string,
  id: number,
}

export default GooglePin
