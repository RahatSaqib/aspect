import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import { useIntl } from 'react-intl'
import filter from 'lodash/filter'
import noop from 'lodash/noop'
import messages from '../messages'
import AspectTooltip from '../../../../components/shared/AspectTooltip'
import { getDayTitle } from '../Helpers'

const cssClasses = classnames.bind(require('../DailyStatus.css'))

const DayBlock = ({ consts, dayModifier, enabled, onClick }) => {
  const {
    blockSize: { width: blockWidth, height: blockHeight, marginWidth },
  } = consts
  return (
    <div
      className={cssClasses('clinic__day', `clinic__day--${dayModifier}`, {
        'clinic__day--disabled': !enabled,
      })}
      style={{
        width: `${blockWidth}px`,
        height: `${blockHeight}px`,
        margin: `0 ${marginWidth / 2}px`,
      }}
      onClick={enabled ? onClick : noop}
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
  enabled: PropTypes.bool.isRequired,
}

const DailyStatusClinicDay = ({
  consts,
  daysInSameStatus,
  isWeekend,
  maintenanceStatusName,
  maintenanceStatusI18nKey,
  maintenanceStatusExternalId,
  statuses,
  totalResults,
  onClickDay,
}) => {
  const isActive =
    maintenanceStatusI18nKey === 'active' ||
    maintenanceStatusI18nKey === 'reportedActive'
  const isEditable = maintenanceStatusExternalId !== 'active'
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

  let title = getDayTitle({
    checked,
    daysInSameStatus,
    formatMessage,
    isActive,
    maintenanceStatusName,
    totalResults,
    messages,
    maintenanceStatusI18nKey,
  })

  if (!isEditable) {
    title = `${title}, ${formatMessage(messages.toolTipTitleNotEditable)}`
  }

  return (
    <AspectTooltip
      title={title}
      toolTipContainerClass="inline__tooltip"
      placement="right"
    >
      <DayBlock
        consts={consts}
        dayModifier={dayModifier}
        enabled={isEditable}
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
