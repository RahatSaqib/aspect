import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import filter from 'lodash/filter'

import AspectTooltip from '../../../../components/shared/AspectTooltip'

const cssClasses = classnames.bind(require('../DailyStatus.css'))

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
  isWeekend,
  maintenanceStatusI18nKey,
  daysInSameStatus,
  statusses,
  consts,
}) => {
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
      title={`${daysInSameStatus} Days since last update`}
      toolTipContainerClass="inline__tooltip"
      placement="right"
    >
      <DayBlock dayModifier={dayModifier} consts={consts} />
    </AspectTooltip>
  ) : (
    <DayBlock dayModifier={dayModifier} consts={consts} />
  )
}

DailyStatusClinicDay.propTypes = {
  isWeekend: PropTypes.string.isRequired,
  maintenanceStatusI18nKey: PropTypes.string.isRequired,
  daysInSameStatus: PropTypes.string.isRequired,
  statusses: PropTypes.string.isRequired,
  consts: PropTypes.shape({
    weekend: PropTypes.string,
  }).isRequired,
}

export { DailyStatusClinicDay, DayBlock }
