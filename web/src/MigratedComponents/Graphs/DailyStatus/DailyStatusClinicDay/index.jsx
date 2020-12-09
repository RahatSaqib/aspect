import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import { defineMessages, useIntl } from 'react-intl'
import filter from 'lodash/filter'

import AspectTooltip from '../../../../components/shared/AspectTooltip'

const cssClasses = classnames.bind(require('../DailyStatus.css'))

const messages = defineMessages({
  toolTipTitleWithStatus: {
    id: 'pages.DailyStatus.DailyStatusClinicDay.toolTipTitleWithStatus',
    defaultMessage: `{maintenanceStatusName} for {daysInSameStatus, plural,
      one {# day}
      other {# days}
    }`,
  },
  toolTipTitleWithoutStatus: {
    id: 'pages.DailyStatus.DailyStatusClinicDay.toolTipTitleWithoutStatus',
    defaultMessage: `{daysInSameStatus, plural,
      one {# day}
      other {# days}
    } since last update`,
  },
})

const DayBlock = ({ dayModifier, consts }) => {
  const {
    blockSize: { width: blockWidth, height: blockHeight, marginWidth },
  } = consts
  return (
    <div
      className={cssClasses('clinic__day', `clinic__day--${dayModifier}`)}
      style={{
        width: `${blockWidth}px`,
        height: `${blockHeight}px`,
        margin: `0 ${marginWidth / 2}px`,
      }}
    />
  )
}

DayBlock.propTypes = {
  dayModifier: PropTypes.string.isRequired,
  consts: PropTypes.shape({
    blockSize: PropTypes.oneOfType([PropTypes.object]),
  }).isRequired,
}

const DailyStatusClinicDay = ({
  consts,
  daysInSameStatus,
  isWeekend,
  maintenanceStatusName,
  maintenanceStatusI18nKey,
  statusses,
}) => {
  const { formatMessage } = useIntl()
  const { weekend } = consts
  const { checked } =
    filter(statusses, {
      i18nKey: maintenanceStatusI18nKey,
    })[0] || false

  let dayModifier = isWeekend ? weekend : null
  if (checked) {
    dayModifier =
      maintenanceStatusI18nKey === 'active' ||
      maintenanceStatusI18nKey === 'reportedActive'
        ? maintenanceStatusI18nKey
        : isWeekend
        ? weekend
        : maintenanceStatusI18nKey
  }

  return checked && daysInSameStatus ? (
    <AspectTooltip
      title={
        maintenanceStatusName
          ? formatMessage(messages.toolTipTitleWithStatus, {
              maintenanceStatusName,
              daysInSameStatus,
            })
          : formatMessage(messages.toolTipTitleWithoutStatus, {
              daysInSameStatus,
            })
      }
      toolTipContainerClass="inline__tooltip"
      placement="right"
    >
      <DayBlock dayModifier={dayModifier} consts={consts} />
    </AspectTooltip>
  ) : (
    <DayBlock dayModifier={dayModifier} consts={consts} />
  )
}

DailyStatusClinicDay.defaultProps = {
  maintenanceStatusName: false,
}

DailyStatusClinicDay.propTypes = {
  isWeekend: PropTypes.string.isRequired,
  maintenanceStatusI18nKey: PropTypes.string.isRequired,
  maintenanceStatusName: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.bool,
  ]),
  daysInSameStatus: PropTypes.string.isRequired,
  statusses: PropTypes.string.isRequired,
  consts: PropTypes.shape({
    weekend: PropTypes.string,
  }).isRequired,
}

export { DailyStatusClinicDay, DayBlock }
