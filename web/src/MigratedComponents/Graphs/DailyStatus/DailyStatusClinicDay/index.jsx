import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'

// eslint-disable-next-line lodash/import-scope
import _ from 'lodash'

import AspectTooltip from '../../../../components/shared/AspectTooltip'

const cssClasses = classnames.bind(require('../DailyStatus.css'))

const DailyStatusClinicDay = ({
  isWeekend,
  maintenanceStatusI18nKey,
  daysInSameStatus,
  statusses,
  consts,
}) => {
  const {
    blockSize: { width: blockWidth, height: blockHeight, marginWidth },
    weekend,
  } = consts

  const { checked } =
    _.filter(statusses, {
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

  const DayBlock = () => (
    <div
      className={cssClasses('clinic__day', `clinic__day--${dayModifier}`)}
      style={{
        width: `${blockWidth}px`,
        height: `${blockHeight}px`,
        margin: `0 ${marginWidth / 2}px`,
      }}
    />
  )

  return checked && daysInSameStatus ? (
    <AspectTooltip
      title={`${daysInSameStatus} Days since last update`}
      toolTipContainerClass="inline__tooltip"
      placement="right"
    >
      <DayBlock />
    </AspectTooltip>
  ) : (
    <DayBlock />
  )
}

DailyStatusClinicDay.propTypes = {
  isWeekend: PropTypes.string.isRequired,
  maintenanceStatusI18nKey: PropTypes.string.isRequired,
  daysInSameStatus: PropTypes.string.isRequired,
  statusses: PropTypes.string.isRequired,
  consts: PropTypes.shape({
    blockSize: PropTypes.oneOfType([PropTypes.object]),
    weekend: PropTypes.string,
  }).isRequired,
}

export default DailyStatusClinicDay
