import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'

import DailyStatusClinicDay from '../DailyStatusClinicDay'

const cssClasses = classnames.bind(require('../DailyStatus.css'))

const DailyStatusClinic = ({ name, data, total, statusses, consts }) => {
  const {
    blockSize: { height: blockHeight, marginWidth },
    totalBlockSize: { width: totalBlockWidth },
  } = consts

  return (
    <div className={cssClasses('clinic__container')}>
      <div className={cssClasses('clinic__name')}>{name}</div>
      <div className={cssClasses('clinic__dayrow')}>
        {data.map(
          ({ isWeekend, maintenanceStatusI18nKey, daysInSameStatus }) => (
            <DailyStatusClinicDay
              isWeekend={isWeekend}
              maintenanceStatusI18nKey={maintenanceStatusI18nKey}
              daysInSameStatus={daysInSameStatus}
              statusses={statusses}
              consts={consts}
            />
          )
        )}
        <div
          className={cssClasses('clinic__testtotal')}
          style={{
            minWidth: totalBlockWidth,
            height: blockHeight,
            margin: `0 ${marginWidth / 2}px`,
          }}
        >
          {total}
        </div>
      </div>
    </div>
  )
}

DailyStatusClinic.propTypes = {
  name: PropTypes.string.isRequired,
  data: PropTypes.oneOfType([PropTypes.object]).isRequired,
  total: PropTypes.number.isRequired,
  statusses: PropTypes.oneOfType([PropTypes.object]).isRequired,
  consts: PropTypes.shape({
    blockSize: PropTypes.oneOfType([PropTypes.object]),
    totalBlockSize: PropTypes.oneOfType([PropTypes.object]),
  }).isRequired,
}

export default DailyStatusClinic
