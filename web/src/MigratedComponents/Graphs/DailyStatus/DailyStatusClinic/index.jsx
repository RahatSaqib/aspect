import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import times from 'lodash/times'
import pick from 'lodash/pick'

import { DailyStatusClinicDay, DayBlock } from '../DailyStatusClinicDay'

const cssClasses = classnames.bind(require('../DailyStatus.css'))

const DailyStatusClinic = ({
  name,
  data,
  total,
  statusses,
  consts,
  totalDays,
}) => {
  const dataDays = data.length
  const fillerDays = times(totalDays - dataDays)
  const {
    blockSize: { height: blockHeight, marginWidth },
    totalBlockSize: { width: totalBlockWidth },
  } = consts

  return (
    <div className={cssClasses('clinic__container')}>
      <div className={cssClasses('clinic__name')}>{name}</div>
      <div className={cssClasses('clinic__dayrow')}>
        {data.map(dailyStatusClinic => (
          <DailyStatusClinicDay
            {...pick(dailyStatusClinic, [
              'daysInSameStatus',
              'isWeekend',
              'maintenanceStatusI18nKey',
              'maintenanceStatusName',
              'totalResults',
            ])}
            consts={consts}
            statusses={statusses}
          />
        ))}
        {fillerDays.map(() => (
          <DayBlock dayModifier="future" consts={consts} />
        ))}
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
  totalDays: PropTypes.number.isRequired,
}

export default DailyStatusClinic
