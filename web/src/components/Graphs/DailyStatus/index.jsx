import React, { useState } from 'react'
import classnames from 'classnames/bind'
import useI18n from '../../../hooks/useI18n'
import Loading from '../../../oldComponents/Loading'
import DATE_CONSTS from '../../../utils/consts/DateTime/CONSTS'
import GRAPH_CONSTS from '../../../utils/consts/Graphs/CONSTS'
import AspectCard from '../../AspectCard'
import AspectDropDown from '../../AspectDropDown'
import CardSelectors from '../CardSelectors'
import { getPreviousPeriod, dateRangeOptions } from '../Helpers/Formatters'
import styles from './DailyStatus.css'
import DailyStatusClinic from './DailyStatusClinic'
import DailyStatusDialog from './DailyStatusDialog'
import DailyStatusFilters from './DailyStatusFilters'
import DateRanges from './DateRanges'
import useDailyStatus from './Helpers/useDailyStatus'
import messages from './messages'

const cssClasses = classnames.bind(styles)

const { DATE_RANGE_OPTIONS } = DATE_CONSTS

const DailyStatus = () => {
  const [dialogState, setDialogState] = useState({ isOpen: false })
  const minDate = getPreviousPeriod('months', "yyyy-MM-dd'T'HH:mm:ss.SSSXXX").start
  const maxDate = getPreviousPeriod('months', "yyyy-MM-dd'T'HH:mm:ss.SSSXXX").end
  const { formatMessage } = useI18n()
  const {
    devices: { devicesIsLoading, devicesIsError, devicesDaily, devicesError },
    statuses: { allStatuses, visibleStatuses, deviceStatusesIsLoading, deviceStatusesIsError, deviceStatusesError },
    actions: { changeDeviceStatus, getDeviceDayDetails, toggleAll, toggleStatusVisibility, updateFromActionComponent },
    dateTime: { dateRanges, totalDays },
  } = useDailyStatus(minDate, maxDate)

  const onClickDay = ({ day, deviceId }) => {
    const {
      deviceName,
      siteProps,
      periodWithSameStatus: { startedOn, endedOn, maintenanceStatusExternalId },
      note,
    } = getDeviceDayDetails({ day, deviceId })
    // day clicked (formatted as "YYYY-MM-DD")
    const data = { day, startedOn, endedOn, deviceId, maintenanceStatusExternalId, note }
    setDialogState({ isOpen: true, deviceName, siteProps, data })
  }

  const onHideDailyStatusDialog = () => {
    setDialogState({ isOpen: false })
  }

  const onDailyStatusSubmit = ({ deviceId, values }) => {
    setDialogState({ isOpen: false })
    changeDeviceStatus({ deviceId, values })
  }

  if (devicesIsError) {
    throw new Error(devicesError)
  }

  if (deviceStatusesIsError) {
    throw new Error(deviceStatusesError)
  }

  const selectorModifiers = [
    {
      selectedValue: 'Date Range',
      endpoint: false,
      state: 'deviceDateRange',
      component: AspectDropDown,
      identifier: 'dateRange',
      data: dateRangeOptions('deviceDateRange'),
      sortByKeys: ['id'],
      isClearable: false,
      defaultSelectedOption: DATE_RANGE_OPTIONS.LAST_MONTH,
    },
  ]

  return (
    <AspectCard
      title={formatMessage(messages.dailyStatusMainTitle)}
      innerSize={12}
      justify="center"
      action={params => updateFromActionComponent({ ...params })}
      actionComponent={{ component: CardSelectors, props: selectorModifiers }}
      name="dailyStatus"
    >
      {!devicesIsLoading && !deviceStatusesIsLoading ? (
        <div className={cssClasses('dailystatus__container')}>
          <DailyStatusFilters toggleAll={toggleAll} statuses={visibleStatuses} action={toggleStatusVisibility} />
          <DateRanges data={dateRanges} consts={GRAPH_CONSTS} />
          {devicesDaily.map(({ id: deviceId, name, shortName, maintenanceStatusHistory, totalResults }) => (
            <DailyStatusClinic
              key={deviceId}
              name={shortName || name}
              data={maintenanceStatusHistory}
              total={totalResults}
              statuses={visibleStatuses}
              consts={GRAPH_CONSTS}
              totalDays={totalDays}
              onClickDay={onClickDay}
              deviceId={deviceId}
            />
          ))}

          {dialogState.isOpen ? (
            <DailyStatusDialog
              data={dialogState.data}
              deviceName={dialogState.deviceName}
              siteProps={dialogState.siteProps}
              onCancel={onHideDailyStatusDialog}
              onSubmit={onDailyStatusSubmit}
              statuses={allStatuses}
            />
          ) : null}
        </div>
      ) : (
        <Loading className={cssClasses('dailyStatus__spinner')} />
      )}
    </AspectCard>
  )
}

export default DailyStatus
