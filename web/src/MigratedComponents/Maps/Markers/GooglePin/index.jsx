import React from 'react'
import { func, shape, string, number } from 'prop-types'
import { OverlayView } from '@react-google-maps/api'
import classnames from 'classnames/bind'
import get from 'lodash/get'

import IconProvider from '../../../IconProvider'
import AspectTooltip from '../../../../components/shared/AspectTooltip'
import useI18n from '../../../../Hooks/i18n/useI18n'

import styles from './GooglePin.css'
import messages from '../../DailyStatus/messages'

const cssClasses = classnames.bind(styles)

const GooglePin = ({
  position,
  config,
  id,
  color,
  info: { maintenanceStatusI18nKey, name },
}) => {
  const { size, click } = config
  const { formatMessage } = useI18n()

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
        {name && maintenanceStatusI18nKey ? (
          <AspectTooltip
            title={`${name}: ${formatMessage(
              get(messages, maintenanceStatusI18nKey, maintenanceStatusI18nKey)
            )}`}
            placement="top"
          >
            <IconProvider icon="FaMapMarkerAlt" title={false} />
          </AspectTooltip>
        ) : (
          <IconProvider icon="FaMapMarkerAlt" title={false} />
        )}
      </div>
    </OverlayView>
  )
}

GooglePin.defaultProps = {
  id: 0,
  color: 'transparent',
  info: {},
}

const configShape = {
  size: number,
  click: func,
}

const positionShape = { lat: number.isRequired, lng: number.isRequired }
const infoShape = {
  maintenanceStatusName: string,
  name: string,
}

GooglePin.propTypes = {
  position: shape(positionShape).isRequired,
  config: shape(configShape).isRequired,
  color: string,
  id: number,
  info: shape(infoShape),
}

export default GooglePin
