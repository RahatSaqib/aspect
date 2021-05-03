import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import times from 'lodash/times'

import { DailyStatusClinicDay, DayBlock } from '../DailyStatusClinicDay'

const cssClasses = classnames.bind(require('../DailyStatus.css'))

const DailyStatusClinic = ({
  name,
  data,
  deviceId,
  total,
  statuses,
  consts,
  totalDays,
  onClickDay,
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
        {data.map(
          ({
            day,
            daysInSameStatus,
            isWeekend,
            maintenanceStatusI18nKey,
            maintenanceStatusExternalId,
            maintenanceStatusName,
            totalResults,
          }) => (
            <DailyStatusClinicDay
              consts={consts}
              daysInSameStatus={daysInSameStatus}
              isWeekend={isWeekend}
              maintenanceStatusI18nKey={maintenanceStatusI18nKey}
              maintenanceStatusName={maintenanceStatusName}
              maintenanceStatusExternalId={maintenanceStatusExternalId}
              totalResults={totalResults}
              statuses={statuses}
              onClickDay={() => onClickDay({ day, deviceId })}
            />
          )
        )}
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
  deviceId: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  statuses: PropTypes.oneOfType([PropTypes.object]).isRequired,
  consts: PropTypes.shape({
    blockSize: PropTypes.oneOfType([PropTypes.object]),
    totalBlockSize: PropTypes.oneOfType([PropTypes.object]),
  }).isRequired,
  totalDays: PropTypes.number.isRequired,
  onClickDay: PropTypes.func.isRequired,
}

export default DailyStatusClinic
