import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import times from 'lodash/times'

import { DailyStatusClinicDay, DayBlock } from '../DailyStatusClinicDay'

import styles from '../DailyStatus.css'

const cssClasses = classnames.bind(styles)

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
          (
            {
              day,
              daysInSameStatus,
              isWeekend,
              maintenanceStatusI18nKey,
              maintenanceStatusExternalId,
              maintenanceStatusName,
              maintenanceStatusManuallySetBy,
              totalResults,
            },
            idx
          ) =>
            idx + 1 <= totalDays ? (
              <DailyStatusClinicDay
                key={`${deviceId}-${day}`}
                consts={consts}
                daysInSameStatus={daysInSameStatus}
                isWeekend={isWeekend}
                maintenanceStatusI18nKey={maintenanceStatusI18nKey}
                maintenanceStatusName={maintenanceStatusName}
                maintenanceStatusManuallySetBy={maintenanceStatusManuallySetBy}
                maintenanceStatusExternalId={maintenanceStatusExternalId}
                totalResults={totalResults}
                statuses={statuses}
                onClickDay={() => onClickDay({ day, deviceId })}
              />
            ) : null
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

DailyStatusClinic.defaultProps = {
  statuses: [],
}

DailyStatusClinic.propTypes = {
  name: PropTypes.string.isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  deviceId: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  statuses: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.arrayOf(PropTypes.object),
  ]),
  consts: PropTypes.shape({
    blockSize: PropTypes.oneOfType([PropTypes.object]),
    totalBlockSize: PropTypes.oneOfType([PropTypes.object]),
  }).isRequired,
  totalDays: PropTypes.number.isRequired,
  onClickDay: PropTypes.func.isRequired,
}

export default DailyStatusClinic
