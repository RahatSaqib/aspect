import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import { defineMessages, useIntl } from 'react-intl'
import filter from 'lodash/filter'

import AspectTooltip from '../../../../components/shared/AspectTooltip'

const cssClasses = classnames.bind(require('../DailyStatus.css'))

const messages = defineMessages({
  toolTipTitleResultsReported: {
    id: 'pages.DailyStatus.DailyStatusClinicDay.toolTipTitleResultsReported',
    defaultMessage: `{maintenanceStatusName} ({totalResults, plural,
      one {# result reported}
      other {# results reported}
    })`,
  },
  toolTipTitleWithStatus: {
    id: 'pages.DailyStatus.DailyStatusClinicDay.toolTipTitleWithStatus',
    defaultMessage: `{maintenanceStatusName} ({totalResults}) for {daysInSameStatus, plural,
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

const getTitle = ({
  checked,
  daysInSameStatus,
  formatMessage,
  isActive,
  maintenanceStatusName,
  totalResults,
}) => {
  if (checked && daysInSameStatus) {
    return maintenanceStatusName
      ? formatMessage(messages.toolTipTitleWithStatus, {
          maintenanceStatusName,
          daysInSameStatus,
          totalResults,
        })
      : formatMessage(messages.toolTipTitleWithoutStatus, {
          daysInSameStatus,
        })
  }
  return isActive
    ? formatMessage(messages.toolTipTitleResultsReported, {
        maintenanceStatusName,
        totalResults,
      })
    : maintenanceStatusName
}

const DayBlock = ({ consts, dayModifier, onClick }) => {
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
      onClick={onClick}
      role="presentation"
    />
  )
}

DayBlock.propTypes = {
  dayModifier: PropTypes.string.isRequired,
  consts: PropTypes.shape({
    blockSize: PropTypes.oneOfType([PropTypes.object]),
  }).isRequired,
  onClick: PropTypes.func.isRequired,
}

const DailyStatusClinicDay = ({
  consts,
  daysInSameStatus,
  isWeekend,
  maintenanceStatusName,
  maintenanceStatusI18nKey,
  statuses,
  totalResults,
  onClickDay,
}) => {
  const isActive =
    maintenanceStatusI18nKey === 'active' ||
    maintenanceStatusI18nKey === 'reportedActive'
  const { formatMessage } = useIntl()
  const { weekend } = consts
  const { checked } =
    filter(statuses, {
      i18nKey: maintenanceStatusI18nKey,
    })[0] || false

  let dayModifier = isWeekend ? weekend : null
  if (checked) {
    dayModifier = isActive
      ? maintenanceStatusI18nKey
      : isWeekend
      ? weekend
      : maintenanceStatusI18nKey
  }

  const title = getTitle({
    checked,
    daysInSameStatus,
    formatMessage,
    isActive,
    maintenanceStatusName,
    totalResults,
  })

  return (
    <AspectTooltip
      title={title}
      toolTipContainerClass="inline__tooltip"
      placement="right"
    >
      <DayBlock
        consts={consts}
        dayModifier={dayModifier}
        onClick={onClickDay}
      />
    </AspectTooltip>
  )
}

DailyStatusClinicDay.defaultProps = {
  maintenanceStatusName: false,
  totalResults: 0,
}

DailyStatusClinicDay.propTypes = {
  isWeekend: PropTypes.string.isRequired,
  maintenanceStatusI18nKey: PropTypes.string.isRequired,
  maintenanceStatusName: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.bool,
  ]),
  daysInSameStatus: PropTypes.string.isRequired,
  statuses: PropTypes.string.isRequired,
  consts: PropTypes.shape({
    weekend: PropTypes.string,
  }).isRequired,
  totalResults: PropTypes.number,
  onClickDay: PropTypes.func.isRequired,
}

export { DailyStatusClinicDay, DayBlock }
