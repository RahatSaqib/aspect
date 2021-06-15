import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import filter from 'lodash/filter'
import isEmpty from 'lodash/isEmpty'
import noop from 'lodash/noop'

import useI18n from '../../../../Hooks/i18n/useI18n'
import messages from '../messages'
import AspectTooltip from '../../../../components/shared/AspectTooltip'
import { getDayTitle } from '../Helpers'

const cssClasses = classnames.bind(require('../DailyStatus.css'))

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
  maintenanceStatusManuallySetBy,
  maintenanceStatusI18nKey,
  maintenanceStatusExternalId,
  statuses,
  totalResults,
  onClickDay,
}) => {
  const { formatDate, formatMessage } = useI18n()
  const isActive =
    maintenanceStatusI18nKey === 'active' ||
    maintenanceStatusI18nKey === 'reportedActive'
  const isEditable = maintenanceStatusExternalId !== 'active'
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

  const title = getDayTitle({
    checked,
    daysInSameStatus,
    formatMessage,
    isActive,
    maintenanceStatusName,
    totalResults,
    messages,
    maintenanceStatusI18nKey,
  })

  const manuallySet = !isEmpty(maintenanceStatusManuallySetBy)
    ? formatMessage(messages.toolTipLastUpdatedBy, {
        username: maintenanceStatusManuallySetBy.name,
        updatedDate: formatDate(
          new Date(maintenanceStatusManuallySetBy.updatedDate)
        ),
      })
    : ''

  return (
    <AspectTooltip
      showPointerCursor={isEditable}
      title={
        !isEditable
          ? `${title}, ${formatMessage(messages.toolTipTitleNotEditable)}`
          : `${title}${manuallySet}`
      }
      toolTipContainerClass="inline__tooltip"
      placement="right"
    >
      <DayBlock
        consts={consts}
        dayModifier={dayModifier}
        onClick={isEditable ? onClickDay : noop}
      />
    </AspectTooltip>
  )
}

DailyStatusClinicDay.defaultProps = {
  maintenanceStatusName: false,
  maintenanceStatusManuallySetBy: {},
  totalResults: 0,
}

DailyStatusClinicDay.propTypes = {
  isWeekend: PropTypes.string.isRequired,
  maintenanceStatusI18nKey: PropTypes.string.isRequired,
  maintenanceStatusName: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.bool,
  ]),
  maintenanceStatusManuallySetBy: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    updatedDate: PropTypes.string,
  }),
  maintenanceStatusExternalId: PropTypes.string.isRequired,
  daysInSameStatus: PropTypes.string.isRequired,
  statuses: PropTypes.string.isRequired,
  consts: PropTypes.shape({
    weekend: PropTypes.string,
  }).isRequired,
  totalResults: PropTypes.number,
  onClickDay: PropTypes.func.isRequired,
}

export { DailyStatusClinicDay, DayBlock }
