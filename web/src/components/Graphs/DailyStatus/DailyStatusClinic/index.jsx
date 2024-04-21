import React from 'react'
import times from 'lodash/times'
import PropTypes from 'prop-types'
import styles from '../DailyStatus.module.css'
import { DailyStatusClinicDay, DayBlock } from '../DailyStatusClinicDay'

const DailyStatusClinic = ({ name, data, deviceId, total, statuses, consts, totalDays, onClickDay }) => {
  const dataDays = data.length
  const fillerDays = times(totalDays - dataDays)
  const {
    blockSize: { height: blockHeight, marginWidth },
    totalBlockSize: { width: totalBlockWidth },
  } = consts

  return (
    <div className={styles.clinic__container}>
      <div className={styles.clinic__name}>{name}</div>
      <div className={styles.clinic__dayrow}>
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
        {fillerDays.map(x => (
          <DayBlock dayModifier="future" consts={consts} key={x} onClick={() => {}} />
        ))}
        <div
          className={styles.clinic__testtotal}
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
  statuses: PropTypes.oneOfType([PropTypes.bool, PropTypes.arrayOf(PropTypes.object)]),
  consts: PropTypes.shape({
    blockSize: PropTypes.oneOfType([PropTypes.object]),
    totalBlockSize: PropTypes.oneOfType([PropTypes.object]),
  }).isRequired,
  totalDays: PropTypes.number.isRequired,
  onClickDay: PropTypes.func.isRequired,
}

/**
 * This is pretty expensive DOM rendering component used in the loop
 * for each device. So, wrap it with `memo` util to cache.
 * Otherwise - parent component will re-render all devices every time
 * a dialog `Set Maintenance Status` is opened or closed with
 * 2-3 seconds (!) delay.
 */
export default React.memo(DailyStatusClinic)
